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
	MATCH: function(){
		this.type = "match";
		this.pointer = "";
		this.reference =  "";
		this.func = "";
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
		this.arguments = [];
		this.func = "";
		this.tokens = []; 
		this.wrapsTokens = true;
	},
	CLS: function(){
		this.type = "cls";
		this.wrapsTokens = false;
	}
};

toffle.template = function(template){
	// Reference for custom user helper functions.
	var helperFunctions = {};
	
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
			
			// set our actual template to be the one defined in the input object
			template = template.template;
		}
	}

	// Compile the template, and any subsequent referenced templates
	toffle.compileTemplate(template, true, pendingTemplates, templates);
	
	var returnObject = {
		templates: {},
		hlprFunctions: helperFunctions,
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
					
					// Add context params.
					context.params = inputParams;
				
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
						
						// Are we dealing with a match or else statement?
						if(context.matchIndexes)
						{
							// Set the context pointer to be the next object that matches
							context.pointer = context.iterative[context.matchIndexes[context.counter - 1]];
						}
						else
						{
							// Set the context pointer to be the object at position 'context.counter - 1' of context.iterative
							context.pointer = context.iterative[context.counter - 1];
						}
						
						// Reset the position.
						context.pos = 0;
					} 
					else
					{					
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
							var paramPool = this.getParamPool(workStack);
							
							var idents = this.parseReference(token.value).idents;
							
							var value = this.grabValue(paramPool, idents);

							output = output + value;
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
							var paramPool = this.getParamPool(workStack);
							
							var idents = this.parseReference(token.condition).idents;
							
							var value = this.grabValue(paramPool, idents);
							
							var condition = value;
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
							var paramPool = this.getParamPool(workStack);
							
							var idents = this.parseReference(token.condition).idents;
							
							var value = this.grabValue(paramPool, idents);
							
							var condition = value;
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
								pointer: null,	
								iterative: null,	
								counter: 1, 	
								iterations: 1	   
							});
						}
						break;
						
					// If the token is 'each' then raise context and set pointer
					case 'each' :
						// Evaluate the reference and get it's length.
						var ref = {};
						var refLength = 0;
						
						try
						{
							var paramPool = this.getParamPool(workStack);
							
							var idents = this.parseReference(token.reference).idents;
							
							var value = this.grabValue(paramPool, idents);
							
							var ref = value;
							
							refLength = ref.length;
						}
						catch(err)
						{
							throw "toffle: error evaluating reference '" + token.reference + "'";
						}
						
						// Don't bother adding a context if we have no values
						if(refLength > 0)
						{
							// Push new context onto the stack.
							workStack.push({
								pos: 0,
								tokens: token.tokens,
								params: {}, 
								pointer: ref[0],	// TODO check we have ANY values in ref
								pointerIdent: token.pointer,
								iterative: ref,	
								counter: 1, 	
								iterations: refLength	   
							});
						}
						break;
						
						// If the token is 'each' then raise context and set pointer
					case 'match' :
						// Evaluate the reference and get it's length.
						var ref = {};
						var refLength = 0;
						var matches = [];
						
						try
						{
							var paramPool = this.getParamPool(workStack);
							
							var idents = this.parseReference(token.reference).idents;
							
							var value = this.grabValue(paramPool, idents);
							
							var ref = value;
						}
						catch(err)
						{
							throw "toffle: error evaluating reference '" + token.reference + "'";
						}
						
						for(var itemIndex = 0; itemIndex < ref.length; itemIndex++)
						{
							// get the item
							var item = ref[itemIndex];
							
							// create argument array for our helper function
							var args = [];
							
							// helper functions used in match statements should always have their first argument being the current item to evaluate
							args.push(item);
							
							// TODO add support for match helper arguments
							
							if(this.hlprFunctions[token.func])
							{
								// Call the helper function, passing the evaluated arguments, and get the boolean result.
								var condition = this.hlprFunctions[token.func].apply(this, args);
								
								// If condition is true then we have a match.
								if(condition)
								{
									// Increment the references length.
									refLength++;
									
									// Add this item index to array of idexes representing items that match.
									matches.push(itemIndex);
								}
							}
							else
							{
								throw "toffle: error! Helper function not specified for match: " + token.func;
							}
						}
						
						// Don't bother adding a context if we have no values
						if(refLength > 0)
						{
							// Push new context onto the stack.
							workStack.push({
								pos: 0,
								tokens: token.tokens,
								params: {}, 
								pointer: ref[matches[0]], // our first pointer should point to first MATCHING item  
								pointerIdent: token.pointer,
								iterative: ref,	
								counter: 1, 	
								matchIndexes: matches,
								iterations: refLength	   
							});
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
						templateContext.params = this.parseParam(token.params, this.getParamPool(workStack));
					
						// Push the template context onto the stack.
						workStack.push(templateContext);
						break;
						
					case 'helper' :
						// Call the helper function (if it exists) passing the evaluated argument values.
						// Helpers can only return true/false so treat this as a if/not context
						
						// Check that there is a matching helper function.
						if(this.hlprFunctions[token.func])
						{
							// Iterate over each helper function argument and replace it with the actual evaluated value.
							for(var argumentIndex = 0; argumentIndex < token.arguments.length; argumentIndex++)
							{
								// Get the current argument
								var currentArgument = token.arguments[argumentIndex];
								
								// set each argument to be its evaluated value
								if((currentArgument.charAt(0) == "'" && currentArgument.charAt(currentArgument.length - 1) == "'") || 
									(currentArgument.charAt(0) == '"' && currentArgument.charAt(currentArgument.length - 1) == '"'))
								{
									token.arguments[argumentIndex] = currentArgument.substring(1, currentArgument.length - 1);
								}
								else if(!isNaN(currentArgument)) 
								{
									// We have a number, set it 
									token.arguments[argumentIndex] = Number(currentArgument);
								}
								else
								{
									// we must have a property accessor. get the value
									var paramPool = this.getParamPool(workStack);
							
									var idents = this.parseReference(currentArgument).idents;
									
									var value = this.grabValue(paramPool, idents);
									
									// Set the evaluated value
									token.arguments[argumentIndex] = value;
								}
							}
							
							// Call the helper function, passing the evaluated arguments, and get the boolean result.
							var condition = this.hlprFunctions[token.func].apply(this, token.arguments);
							
							// If condition is true then push a new context onto the stack.
							if(condition)
							{
								workStack.push({
									pos: 0,
									tokens: token.tokens,
									params: {}, 
									pointer: null,	
									iterative: null,	
									counter: 1, 	
									iterations: 1	   
								});
							}
						}
						else
						{
							throw "toffle: error! Helper function not specified: " + token.func;
						}
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
						
						// check the details for a 'parse' function, if one is there then pass it the raw json.
						if('parse' in details)
						{
							// wrap this in a try, in case the user was naughty and didn't pass us a valid function
							try
							{
								// parse the JSON, the user will have to return either true or false. true to continue, false to abort.
								var continueProcessing = details.parse(responseJSON);
								
								// has the user requested that the operation be aborted.
								if(!continueProcessing)
								{
									return;
								}
							}
							catch(err)
							{
								returnObj.handleAjaxError(details, err, "toffle: Error parsing JSON.");
								return;
							}
						}
						
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
		
		getParamPool: function(stack){
			var pool = {};
			
			// go up through the contexts, from root (initial template) to the context that has the current scope 
			for(var contextIndex = 0; contextIndex < stack.length; contextIndex++)
			{
				// get the current context
				var context = stack[contextIndex];
				
				// add the parameters to the pool
				for(var key in context.params) 
				{
					pool[key] = context.params[key];
				}
				
				// if we are dealing with an 'each' context we will need to add the pointer reference
				if(context.pointerIdent) 
				{
					pool[context.pointerIdent] = context.pointer;
				}
			}
		
			return pool;
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
		},
		
		parseParam: function(param, paramPool) {
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
						
						// TODO Determine whet the hell kind of value 'paramValue' is. Could be:
						//   - String:  		Will be wrapped in " or ', simply do 'outputParams[alias] = paramValue' but strip the quotes off first.
						//   - Number:  		Check for any valid number, to check see if '!isNaN(paramValue)' is true, if so then do 'outputParams[alias] = paramValue'.
						//   - Property Accessor:	We will have to call parseReference() and grabValue() to get the property that is being set as a parameter.

						// are we dealing with a string
						if((paramvalue.charAt(0) == "'" && paramvalue.charAt(paramvalue.length - 1) == "'") || 
							(paramvalue.charAt(0) == '"' && paramvalue.charAt(paramvalue.length - 1) == '"'))
						{
							outputParams[alias] = paramvalue.substring(1, paramvalue.length - 1);
						}
						else if(!isNaN(paramvalue)) 
						{
							// We have a number, set it 
							outputParams[alias] = Number(paramvalue);
						}
						else
						{
							// we must have a property accessor. get the value
							var idents = this.parseReference(paramvalue).idents;
							
							var value = this.grabValue(paramPool, idents);
							
							// Set the evaluated value
							outputParams[alias] = value;
						}
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
				// cut off 'plug' and template name tokens.
				subTokens.splice(0,2);
				
				// Set the parameters on the token. 
				tokenObj.params = subTokens.join(' ');
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
			
		// MATCH STATEMENT  <^ match cat in ??catIsYoung cats ^>
		case "match":
			tokenObj = new toffle.tokenType.MATCH();
		
			// Check we have enough sub tokens to form a valid 'each' statement.
			if(subTokens.length > 4)
			{
				// Ensure that we have our 'in' in the correct place.
				if(subTokens[2] == 'in')
				{
					// Set the pointer
					tokenObj.pointer = subTokens[1];
					
					if(subTokens[3].length > 2 && (subTokens[3].substring(0,2) == '??'))
					{
						// set the helper function name
						tokenObj.func = subTokens[3].substring(2);
					
						// Collect the rest of the subTokens to for the target object literal/identifier.
						subTokens.splice(0,4);
						
						tokenObj.reference = subTokens.join(' ');
					}
					else 
					{
						// This is not the correct syntax for a helper function, Error.
						throw "toffle: Compilation failed! Incorrect 'match' declaration, not a valid Helper identifier: " + subTokens[3];
					}
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
			// check for helpers (start with '?')
			if(subTokens[0].length > 1 && (subTokens[0].substring(0,2) == '??'))
			{
				// Set our token type.
				tokenObj = new toffle.tokenType.HELPER();
				
				// set the function name
				tokenObj.func = subTokens[0].substring(2);
			
				// Cut out our function identifier.
				subTokens.splice(0,1);
				
				// the following subtokens should be method arguments
				// TODO don't split on whitespace in strings!
				tokenObj.arguments = subTokens;	
			}
			else
			{
				// Set our token type.
				tokenObj = new toffle.tokenType.REF();
				
				// Set the token value.
				tokenObj.value = token;
			}
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