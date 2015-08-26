function toffle(){};

var updOpen = '<^';
var updClose = '^>';
var updContentClose = '<^/^>';

toffle.tokenType = {
	IF: function(){
		this.type = "if";
		this.condition = "";
		this.tokens = [];
		this.wrapsTokens = true;
	},
	NOT: function(){
		this.type = "not";
		this.condition = "";
		this.tokens = []; 
		this.wrapsTokens = true;
	},
	REF: function(){
		this.type = "ref";
		this.value = "";
		this.wrapsTokens = false;
	},
	TEMP: function(){
		this.type = "template";
		this.template = "";
		this.params = "";
		this.wrapsTokens = false;
	},
	EACH: function(){
		this.type = "each";
		this.pointer = "";
		this.reference =  "";
		this.tokens = [];
		this.wrapsTokens = true;
	},
	CONTENT: function(){
		this.type = "content";
		this.value = "";
		this.wrapsTokens = false;
	},
	HELPER: function(){
		this.type = "helper";
		this.func = null;
		this.wrapsTokens = false;
	},
	CLS: function(){
		this.type = "cls";
		this.wrapsTokens = false;
	}
};

toffle.template = function(template){
	// Reference for available JSON parameters.
	var p$ = {};
	
	// Reference for custom user helper functions.
	var helperFunctions = {};
	
	// Defines whether expressions will be processed by toffle or by the javascript interpreter.
	var sandboxMode = true;
	
	// Compiled Templates
	var templates = [];

	// Identifiers of templates that are currently being processed
	var pendingTemplates = [];
	
	// Check to see if we were passed a DOM element(our template) or an object(defines template object, helpers, etc...)
	if(template)
	{
		// check to see whether this is a DOM node (our template)
		if (template.nodeType && template.nodeType === 1) 
		{
			// if our element is not a toffle-template type then were are not good to go
			if(!(template.type == "text/toffle-template"))
			{
				throw "toffle: template DOM element must be defined as type 'text/toffle-template'";
			}
		}
		else
		{
			// ensure that the user has defined an intiial template
			if(!('template' in template))
			{
				throw "toffle: error! you must provide an initial template";
			}
			
			// has the user defined any helper function, if so then grab them
			if('helpers' in template)
			{
				// set each function on our 'helperFunctions' object for later use when were parsing our template body
				for (var helper in template.helpers) {
					helperFunctions[helper] = template.helpers[helper];
				}
			}
			
			// check whether the user has explicitly defined whether they want to process templates in the sandboxed mode
			if('sandboxed' in template)
			{
				sandboxMode = template.sandboxed;
			}
			
			// set our actual template to be the one defined in the input object
			template = template.template;
		}
	}

	// Compile the template, and any subsequent referenced templates
	toffle.compileTemplate(template, true, pendingTemplates, templates);
	
	var returnObject = {
		sandboxed: sandboxMode,
		templates: {},
		go: function(inputParams){
			// Our output.
			var output = '';
		
			// Our call stack. Is an array of token arrays.
			var workStack = [];
			
			// Our root context
			var context = {
				pos: 0,
				tokens: [],
				params: {}, 	// Contains template context params and variables that are set in the scope of this context.
				preParams: {},  // Reference of all params that will be overwritten by the params introduced in this context.
				pointer: null,	// Only used in looping (The current item in iterative).
				iterative: null,	// Only used in looping (The object we are looping through).
				counter: 1, 	// Only really for looping, 1 otherwise.
				iterations: 1	   // Only really for looping, 1 otherwise.
			}
			
			// Get the initial template and add its tokens into a root context.
			for(var templateId in this.templates){
				var currentTemplate = this.templates[templateId];

				if(currentTemplate.isInitialTemplate)
				{
					// Add the root AST tokens to the context.
					for(var i = 0; i < currentTemplate.ast.tokens.length; i++)
					{
						// Push this token to our root context
						context.tokens.push(currentTemplate.ast.tokens[i]);
					}
					
					// TODO Add context params.
					context.params = inputParams;
				
					// Set the params globally.
					toffle.raiseParams(context.params);
					
					// Push this context onto the work stack.
					workStack.push(context);
					
					// We've found our initial template, break.
					break;
				}
			}
			
			// Now we have root context we can begin.
			while(true)
			{
				// Our current context.
				var context;
				
				// Get the current context, if we dont have one then we are done.
				if(workStack.length == 0)
				{
					break;
				}
				else
				{
					// Set the current context.
					context = workStack[workStack. length - 1];
				}
				
				// If our position is on the last token in our context then we are done with this context. pop it from the stack.
				if(context.pos == context.tokens.length)
				{
					// We could have to repeat a context multiple times (looping).
					// If this is true, and the context count is less than the number of iterations required
					// to complete the loop, then we just increment the counter, reset the position and keep the context on the stack.
					if(context.counter < context.iterations)
					{
						// Increment the counter.
						context.counter = context.counter + 1;
						
						// Set the context pointer to be the object at position 'context.counter - 1' of context.iterative
						context.pointer = context.iterative[context.counter - 1];
						
						// Reset the pointer value.
						window[context.pointerIdent] = context.pointer;
						
						// Reset the position.
						context.pos = 0;
					} 
					else
					{
						// If this context has any params, they need to be deleted.
						toffle.dropParams(context.params);
						
						// Re-raise any params that were overwritten by this context,
						toffle.raiseParams(context.preParams);
					
						// Pop it from the stack.
						workStack.pop();
						
						// We have gotten rid of a context, continue to attempt to get another.
						continue;
					}
				}
				
				// Get the current token position.
				var pos = context.pos;
				
				// Get the token at the current position.
				var token = context.tokens[context.pos];
				
				// ------- Process Token ---------
				switch(token.type)
				{
					// If the token is just content then just spit it out.
					case 'content' :
						output = output + token.value;
						break;
						
						// If the token is 'ref' then spit out evaluated value
					case 'ref' :
						try
						{
							output = output + eval(token.value);
						}
						catch(err)
						{
							throw "toffle: error evaluating value '" + token.value + "'";
						}
						break;
					
					// If the token is 'if' then evaluate its condition, if true then raise context
					case 'if' :
						// Evaluate the condition for this 'if'.
						try
						{
							var condition = eval(token.condition);
						}
						catch(err)
						{
							throw "toffle: error evaluating condition '" + token.condition + "'";
						}
						
						// If 'true' then push a new context onto the stack.
						if(condition)
						{
							workStack.push({
								pos: 0,
								tokens: token.tokens,
								params: {}, 
								preParams: {},
								pointer: null,	
								iterative: null,	
								counter: 1, 	
								iterations: 1	   
							});
						}
						break;
					
					// If the token is 'not' then evaluate its condition, if false then raise context
					case 'not' :
						// Evaluate the condition for this 'not'.
						try
						{
							var condition = eval(token.condition);
						}
						catch(err)
						{
							throw "toffle: error evaluating condition '" + token.condition + "'";
						}
						
						// If condition is false then push a new context onto the stack.
						if(!condition)
						{
							workStack.push({
								pos: 0,
								tokens: token.tokens,
								params: {}, 
								preParams: {},
								pointer: null,	
								iterative: null,	
								counter: 1, 	
								iterations: 1	   
							});
						}
						break;
						
					// If the token is 'for' then raise context and set pointer
					case 'each' :
						// Evaluate the reference and get it's length.
						var ref = {};
						var refLength = 0;
						try
						{
							ref = eval(token.reference);
							refLength = ref.length;
						}
						catch(err)
						{
							throw "toffle: error evaluating reference '" + token.reference + "'";
						}
						
						// Push new context onto the stack.
						workStack.push({
							pos: 0,
							tokens: token.tokens,
							params: {}, 
							preParams: {},
							pointer: ref[0],	
							pointerIdent: token.pointer,
							iterative: ref,	
							counter: 1, 	
							iterations: refLength	   
						});
						
						// Determine if the pointer variable will overwrite a variable set elsewhere (lower in the stack).
						// If so, we will keep a reference of the original value in the context to re-raise when we pop
						// the current context.
						if(window.hasOwnProperty(token.pointer))
						{
							workStack[workStack.length - 1].preParams[token.pointer] = window[token.pointer];
						}
						
						// Set window variable for our pointer.
						try
						{
							window[token.pointer] = ref[0];
						}
						catch(err)
						{
							throw "toffle: error setting variable";
						}
						break;
						
					// If the token is 'toffle' then raise context and do some stuff.
					case 'template' :
						// Get the target template
						var targetTemplate = this.templates[token.template];
						
						// Create a new context for this template.
						var templateContext = {
							pos: 0,
							tokens: [],
							params: {}, 
							preParams: {},
							pointer: {},	
							iterative: {},	
							counter: 1, 	
							iterations: 1	   
						};
						
						// Add the new template tokens to the template context.
						for(var i = 0; i < targetTemplate.ast.tokens.length; i++)
						{
							// Push this token to our context.
							templateContext.tokens.push(targetTemplate.ast.tokens[i]);
						}
						
						// Parse the template params and set them in the context.
						templateContext.params = toffle.parseParam(token.params);
						
						// Any global variables that will be overwritten by any template params should be saved 
						// against the template to be reset when the context is destroyed.
						for (var key in templateContext.params) {
							if(window.hasOwnProperty(key))
							{
								templateContext.preParams[key] = window[key];
							}
						}
						
						// Create global variables for each of our parameters.
						toffle.raiseParams(templateContext.params);
					
						// Push the template context onto the stack.
						workStack.push(templateContext);
						break;
					
						
					// Token type is not recognised. Throw error.
					default:
						throw "toffle: error! Unknown token type: " + token.type;
				}
				// -------------------------------
				
				// Increment the position.
				context.pos = context.pos + 1;
			}
			
			return output;
		},
		
		// Carries out a get/post ajax call to asynchronously remotely fetch JSON from elsewhere, compile it, process the templates
		// and plug the output to a location (dropoff value in details parameter, if specified) when were done. Users can also add a 'finished'
		// callback which we will pass the template output and fetched JSON to. 
		goAway: function(details){
			// check that we have been given our details object
			if(!details)
			{
				throw "toffle: error! you must specify details for this function";
			}
			
			// check that the user specified a url
			if(!('url' in details))
			{
				throw "toffle: error! no url specified";
			}
			
			// check that the user specified a url
			if(!('type' in details))
			{
				throw "toffle: error! no type specified";
			}
			
			// do our ajax request
			try
			{
				var xmlhttp;
				
				if (window.XMLHttpRequest)
				{
					// code for IE7+, Firefox, Chrome, Opera, Safari
					xmlhttp=new XMLHttpRequest();
				}
				else
				{
					// code for IE6, IE5
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}
				
				//  get a reference to this so we can reach 'handleAjaxError' in 'onreadystatechange'
				var returnObj = this;
					
				xmlhttp.onreadystatechange = function()
				{
					if (xmlhttp.readyState==4 && xmlhttp.status==200)
					{
						// our response as JSON
						var responseJSON;
						
						// attempt to parse our response text as JSON
						try
						{
							// parse the response
							responseJSON = JSON.parse(xmlhttp.responseText);
						}
						catch(err)
						{
							returnObj.handleAjaxError(details, err, "toffle: error parsing returned data as JSON");
							return;
						}
						
						// TODO check the details for a 'parse' function, if one is there then pass it the raw json.
						// if the user has been good then they will have done their own manipulation on the json and returned the 
						// json that we should actually use to generate our output.
						
						// our template output
						var templateOutput;
						
						// now lets try to actually generate some HTML
						try
						{
							templateOutput = returnObj.go(responseJSON);
						}
						catch(err)
						{
							returnObj.handleAjaxError(details, err, "toffle: error generating output");
							return;
						}
						
						// if the user has specified a dropoff, then fill that container with our template output
						if('dropoff' in details)
						{
							// wrap this in a try, in case the user was naughty and didn't pass us a valid object
							try
							{
								details.dropoff.innerHTML = templateOutput;
							}
							catch(err)
							{
								returnObj.handleAjaxError(details, err, "toffle: error! invalid dropoff");
								return;
							}
						}
						
						// everything seems to have went well. If the user specified a 'finished' method then call it
						if('finished' in details)
						{
							// pass our user the json with which we generated the output, and the output itself
							details.finished({
								responseJSON: responseJSON,
								output: templateOutput
							});
						}
					}
				}

				xmlhttp.open(details.type, details.url, true);
				
				if('data' in details && details.type.toUpperCase() == 'POST')
				{
					xmlhttp.send(details.data);
				}
				else 
				{
					xmlhttp.send();
				}
			}
			catch(err)
			{
				this.handleAjaxError(details, err, "toffle: error carrying out ajax request");
			}
		},
		
		// A convenience method. Assumes that the input params is , at the top level, an array. Iterates over this array 
		// rather than the user having to add an 'each' statement to the initial template.
		goOver: function(inputParams){
		
		},
		
		// Takes a parsed user defined JSON reference and an object containing our accessible data objects and 
		// carries out an eval-less get for the value.
		grabValue: function(params, ref){
			// get data object from params
			var currentIdent = params;

			// if we hit an undefined value, return it
			if(currentIdent == undefined)
			{
				return undefined;
			}

			for(var i = 0; i < ref.length; i++)
			{
				var indexIdents = ref[i].sub;

				if(indexIdents.length > 0)
				{
					// recursively call grabValue to determine our index value
					currentIdent = currentIdent[ref[i].name][grabValue(params,ref[i].sub)]; 
					
					// check if we have trailing square bracket property accessors. 
					if(ref[i].subTrail)
					{
						// if we do, recursively call grabValue() to reach our value
						for(var s = 0; s < ref[i].subTrail.length; s++)
						{
							// get sub
							var sub = ref[i].subTrail[s];
							
							// get next value
							currentIdent = currentIdent[grabValue(params, sub)];
						}
					}
				}
				else
				{
					// set the current value
					currentIdent = currentIdent[ref[i].name];
				}
				
				// if we hit an undefined value, return it
				if(currentIdent == undefined)
				{
					return undefined;
				}
				
			}

			// return the target value
			return currentIdent;
		},
		
		// parses a user defined JSON reference
		parseReference: function(input){
			// a count of the characters iterated over in 'input'
			var charCount = 0;
			
			// our array of identifiers
			var idents = [];
			
			// current identifier
			var currentIdent = '';
			
			// iterate over all the characters in our input and process the accordingly
			for(var i = 0; i < input.length; i++)
			{
				// geth the character the the current position
				var ch = input.charAt(i);
				
				if(ch == '.')
				{
					// the '.' defines the seperation of scope, record 'currentIdent' as an identifier
					if(currentIdent.length > 0)
					{
						idents.push({
							name: currentIdent.trim(),
							sub: []
						});
					}
					
					// reset the identifier
					currentIdent = '';
				}
				else if(ch == '[')
				{
					// the '[' defines that we are dealing with the identifier for an array and we have hit the squre brackets wrapping its index 
					// first of all, we have a vaild identifier, ONLY if it is not empty, if it is then this index is directly following another e.g. 'me[details][age]' 
					if(currentIdent.length > 0)
					{
						idents.push({
							name: currentIdent.trim(),
							sub: []
						});
					}
					
					// reset the identifier
					currentIdent = '';
						
					// check to see if the user wants to use a literal string identifier '[[some.pants#but/valid.json@identifier]]'
					if(input.charAt(i + 1) == '[')
					{
						var literalClosed = false;
						
						// loop through the input to find the closing ']]'
						for(var x = (i + 2); x < (input.length - 1); x++){
						
							// we have found the closing ']]'
							if(input.substring(x, x + 2) == ']]')
							{
								literalClosed = true;
								
								idents.push({
									name: input.substring(i + 2, x),
									sub: [],
									literal: true
								});
								
								break;
							}
						}
						
						if(!literalClosed)
						{
							throw "toffle: No closing ']]' for literal identifier";
						}
						
						charCount += (x - i) + 1;
						i += (x - i) + 1;
					}
					else
					{
						// recursively call this function to parse the reference in the square brackets
						var subIdents = parseReference(input.substring(i+1));
						
						if(idents[idents.length - 1].sub.length == 0)
						{
							// set the index reference identifiers on the current identifier
							idents[idents.length - 1].sub = subIdents.idents;
						}
						else
						{
							if(!idents[idents.length - 1].subTrail)
							{
								idents[idents.length - 1].subTrail = [];
								idents[idents.length - 1].subTrail.push(subIdents.idents);
							}
							else
							{
								idents[idents.length - 1].subTrail.push(subIdents.idents);
							}
						}
						
						// we have to increment our count by the amount of characters processed in our 'parseReference()' call
						charCount += subIdents.count;
						i += subIdents.count;
					}
				}
				else if(ch == ']')
				{
					// the ']' defines that we are dealing with the identifier for an array and we have hit the closing square brackets wrapping its index 
					// first of all, if we have a 'currentIdent' then add it before we pass our gathered identifiers back to the caller.
					if(currentIdent.length > 0)
					{
						idents.push({
							name: currentIdent.trim(),
							sub: []
						});
					}
					
					return { idents:idents, count: charCount + 1 };
				}
				else 
				{
					// add the current character to our current identifier
					currentIdent = currentIdent + ch;
				}
				
				charCount++;
			}
			
			// if we have a value for 'currentIdent' then add it as the last identifier will not be followed by a '.'
			if(currentIdent.length > 0)
			{
				idents.push({
					name: currentIdent.trim(),
					sub: []
				});
			}
			
			// add the length of our trailing identifer to the number of characters processed
			charCount += currentIdent.length;
			
			return { idents:idents, count: charCount };
		},
		
		handleAjaxError: function(details, error, message){
			// something went wrong, call the user specified 'failed' function, if there is one.
			if('failed' in details)
			{
				details.failed(error);
			}
			else
			{
				// If the user doesnt want to handle this by specifying a 'failed' callback, then just error.
				throw message;
			}
		}
	}
	
	// Add our templates to our returning object.
	for(var i = 0; i < templates.length; i++)
	{
		returnObject.templates[templates[i].name] = {
			ast: templates[i].temp.AST,
			isInitialTemplate: templates[i].temp.initialTemplate,
			varList: []
		};
	}
	
	return returnObject;
};

toffle.compileTemplate = function(template, initialTemplate, pendingTemplates, templates){

	// Ensure that this template even exists in the document.
	if(template == null)
	{
		throw "toffle: Compilation failed! Could not find Template.";
	}

	var currentTemplate = {
		initialTemplate: initialTemplate,
		tokens: [],
		openTokens: [],
		AST: {},
		templateString: template.innerHTML
	};
	
	// Add this templates id to the list of pending compilations as reference for when we wish to compile sub-referenced templates.
	pendingTemplates.push(template.id);

	// Flag that defines when we've found an opening marker but not its accompanying closing marker.
	var isTokenUnclosed = false;

	// Variable to store template content.
	var content = "";
	
	// Tokenise our template
	for(var i = 0; i < (currentTemplate.templateString.length - 1); i++)
	{
		if(currentTemplate.templateString.slice(i, i+2) == updOpen)
		{
			if(content.length > 0)
			{
				var contentToken = new toffle.tokenType.CONTENT();
				contentToken.value = content;
				currentTemplate.tokens.push(contentToken);
				content = "";
			}

			currentTemplate.openTokens.push(i);
			isTokenUnclosed = true;
		} 
		else if(currentTemplate.templateString.slice(i, i+2) == updClose)
		{
			// Iterate over closing marker.
			i += 2;

			isTokenUnclosed = false;
			var openingTokenIndex = currentTemplate.openTokens.pop();
			var newToken = currentTemplate.templateString.slice(openingTokenIndex, i);

			// Parse the plain text token into an uppidt token.
			newToken = toffle.tokenify(newToken, template.id, pendingTemplates, templates);	

			newToken.tokenIndex = i - openingTokenIndex;		

			// Add the token to the template.
			currentTemplate.tokens.push(newToken);
		}

		// Add current character to our content variable.
		if(!isTokenUnclosed)
		{
			content += currentTemplate.templateString.charAt(i);
		}
	}
	
	// Sweep up leftover template content.
	if(content.length > 0)
	{
		var contentToken = new toffle.tokenType.CONTENT();
		contentToken.value = content;
		currentTemplate.tokens.push(contentToken);
		content = "";
	}

	// Check for unclosed tokens, compilation fails if we have any
	if(currentTemplate.openTokens.length > 0)
	{
		throw "toffle: Compilation failed! No closing '^>'";
	}
	
	// Generate an AST for the template tokens
	var templateAST = toffle.generateTokenAST(currentTemplate);

	// Set the AST variable.
	currentTemplate.AST = templateAST;

	// Add this entry point template to the list of compiled templates
	templates.push({
		name: template.id,
		temp: currentTemplate
		});
};

toffle.tokenify = function(token, currentTemplate, pendingTemplates, templates) {
	var tokenObj;

	// First step is to determine if this token is a content closer.
	if(token == updContentClose)
	{
		return new toffle.tokenType.CLS();
	}

	// First we need to strip off the leading '<^' and trailing '^>' and trim.
	token = token.replace('<^','');
	token = token.replace('^>','');
	token = token.trim();
	
	var subTokens = token.split(' ');
	
	switch (subTokens[0]) {
		// TEMPLATE REFERENCE
		case "plug":
			tokenObj = new toffle.tokenType.TEMP();
			
			// Set the target template
			tokenObj.template = subTokens[1];
			
			// Get target template
			var referencedTemplate = document.getElementById(tokenObj.template);
			
			// Compile this new template that we have found IF! it is not compiled and it is not the 
			// template we are currently compiling,
			var templateIsCompiled = false;
			for (var z = 0; z < pendingTemplates.length; z++)
			{
				if(pendingTemplates[z] == tokenObj.template)
				{
					templateIsCompiled = true;
					break;
				}
			}
			if((tokenObj.template != currentTemplate) && !templateIsCompiled)
			{
				toffle.compileTemplate(referencedTemplate, false, pendingTemplates, templates);
			}
			
			// Gather up all other subtokens as these make up the user defined parameters.
			// This template may not require parameters.
			if(subTokens.length > 2)
			{
				var params = "";
				
				// Gather subTokens. 
				for(var b = 2; b < subTokens.length; b++)
				{
					params = params + subTokens[b];
				}
				
				// Set the parameters on the token. 
				tokenObj.params = params;
			}
			else
			{
				// We have no parameters.
				tokenObj.params = ""; 
			}
			break;

		// EACH STATEMENT
		case "each":
			tokenObj = new toffle.tokenType.EACH();
			
			// Check we have enough sub tokens to form a valid 'each' statement.
			if(subTokens.length > 3)
			{
				// Ensure that we have our 'in' in the correct place.
				if(subTokens[2] == 'in')
				{
					// Set the pointer
					tokenObj.pointer = subTokens[1];
					
					// Collect the rest of the subTokens to for the target object literal/identifier.
					subTokens.splice(0,3);
					
					tokenObj.reference = subTokens.join(' ');
				}
				else
				{	
					// No 'in' keyword, Error.
					throw "toffle: Compilation failed! Incorrect 'each' declaration, missing 'in'.";
				}
			}
			else
			{
				// Not enough sub tokens to form a valid 'each' statement, Error.
				throw "toffle: Compilation failed! Incorrect 'each' declaration.";
			}
			break;

		// IF STATEMENT
		case "if":
			// Set our token type.
			tokenObj = new toffle.tokenType.IF();
			
			// Gather up all other subtokens as these make up the condition
			if(subTokens.length > 1)
			{
				// Cut out our 'if' item.
				subTokens.splice(0,1);
		
				// Set the condition on the token. 
				tokenObj.condition = subTokens.join(' ');
			}
			else
			{
				// We have no condition, Error.
				throw "toffle: Compilation failed! Missing 'if' condition.";
			}
			break;

		// NOT STATEMENT
		case "not":
			// Set our token type.
			tokenObj = new toffle.tokenType.NOT();
			
			// Gather up all other subtokens as these make up the condition
			if(subTokens.length > 1)
			{
				// Cut out our 'not' item.
				subTokens.splice(0,1);
		
				// Set the condition on the token. 
				tokenObj.condition = subTokens.join(' ');
			}
			else
			{
				// We have no condition, Error.
				throw "toffle: Compilation failed! Missing 'not' condition.";
			}
			break;
		
		// SIMPLE REFERENCES
		default:
			// Set our token type.
			tokenObj = new toffle.tokenType.REF();
			
			// Set the token value.
			tokenObj.value = token;
	}
	
	// Return the token.
	return tokenObj;
};

toffle.generateTokenAST = function(template){
	// Create the tree.
	var tree = [];

	// Set a root for the AST.
	tree.push({
		tokens: []
	});

	// Iterate through tokens and build our tree.
	for (var tokenIndex = 0; tokenIndex < template.tokens.length; tokenIndex++) 
	{
		// Get current token.
		var token = template.tokens[tokenIndex];

		// Check to see if this token can contain other tokens.
		if(token.wrapsTokens)
		{
			// Add the token
			tree.push(token);
		}
		else
		{
			// Check for closing token
			if(token.type == 'cls')
			{
				// This is a closing token, pop the current off the stack. 
				var currentToken = tree.pop();

				tree[tree.length - 1].tokens.push(currentToken);
			}
			else
			{
				// Get the current token. 
				var currentToken = tree[tree.length - 1];

				// Add the token
				currentToken.tokens.push(token);
			}
		}
	};

	// Return our root token.
	return tree[0];
};

toffle.raiseParams = function(params){
	for (var key in params) {
		window[key] = params[key];
	}
};

toffle.dropParams = function(params){
	for (var key in params) {
		delete window[key];
	}
};

toffle.parseParam = function(param) {
	// Trim the input
	param = param.trim();

	// Check for parenthesis
	if((param.charAt(0) == '(') && (param.charAt(param.length-1) == ')')) 
	{
		// our output parameter object
		var outputParams = {};
		
		//strip the parenthesis
		param = param.substring(1, param.length - 1);
		
		// split the parameters on ","
		var params = param.split(",");

		// Iterate over each value in the parameters and attempt to evaluate each.
		// set the actual value to be the output of the eval() method. This sounds crazy but if a value
		// happens to be a string that represents another json object then this will replace the string
		// with the actual object.
		for (var i = 0; i < params.length; i++) 
		{
			// get current param and neaten it up
			currentParam = params[i].trim();
			
			// try to split the param on the ":" caracter to see if it is aliased
			currentParamSections = currentParam.split(":");
			
			// each param will have an alias, make sure we have one
			if(currentParamSections.length == 2)
			{
				// set the parameter alias. 
				var alias = currentParamSections[0];
				
				var paramvalue = currentParamSections[1];
				
				try 
				{
					// TODO Eventually we will have to take security into account. Look into creating a 
					// a wrapper for eval with its own scope for variables. (Look into a javascript 
					// expression parser to append all object identifiers to a safe namespace 'toffle.$')
					evaluatedValue = eval(paramvalue);
				}
				catch(err) 
				{
					// This is not an object reference, leave it be.
					evaluatedValue = paramvalue;
				}
				
				// Set the evaluated value
				outputParams[alias] = evaluatedValue;
			}
			else
			{
				throw "toffle: Error evaluating parameter alias: " + currentParam;
			}
		}
		
		// Return our evaluated literal input.
		return outputParams;
	}
	else
	{
		throw "toffle: Error evaluating parameter input, must be wrappend in parenthesis: " + param;
	} 
};

toffle.destringToken = function(token){
  	var parsedToken = token; 
	var tokenResourceLibrary = []; 
	var tokenResourceCount = 0;
	var indexPatternDoubleQuotes = /\"(.*?)\"/g;
	var indexPatternSingleQuotes = /\'(.*?)\'/g;
	var complete = false;
	
	// Remove all strings written with double quotes
	while(!complete)
	{
		var string = indexPatternDoubleQuotes.exec(parsedToken);
		if(string != null)
		{
			var matchPosition = string.index;
			parsedToken = parsedToken.replace(string[0], '^UTR:'+ tokenResourceCount +'^');
			tokenResourceLibrary.push({
				id: tokenResourceCount++,
				resource: string[0],
				value: string[1],
				pos: string.index
			});
		}
		else
		{
			complete = true;
		}
	}
	
	// Now do single quotes
	complete = false;
	
	while(!complete)
	{
		var string = indexPatternSingleQuotes.exec(parsedToken);
		if(string != null)
		{
			parsedToken = parsedToken.replace(string[0], '^UTR:'+ tokenResourceCount +'^');
			tokenResourceLibrary.push({
				id: tokenResourceCount++,
				resource: string[0],
				value: string[1],
				pos: string.index
			});
		}
		else
		{
			complete = true;
		}
	}
	
	return { token: parsedToken, resourceLibrary: tokenResourceLibrary };
};