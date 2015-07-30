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
	FOR: function(){
		this.type = "for";
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
	CLS: function(){
		this.type = "cls";
		this.wrapsTokens = false;
	}
};

// Compiled Templates
toffle.templates = [];

// Identifiers of templates that are currently being processed
toffle.pendingTemplates = [];

toffle.template = function(template){
	// Compile the template, and any subsequent referenced templates
	toffle.compileTemplate(template, true);
	
	var returnObject = {
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
					case 'for' :
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
		}
	}
	
	// Add our templates to our returning object.
	for(var i = 0; i < toffle.templates.length; i++)
	{
		returnObject.templates[toffle.templates[i].name] = {
			ast: toffle.templates[i].temp.AST,
			isInitialTemplate: toffle.templates[i].temp.initialTemplate,
			varList: []
		};
	}
	
	return returnObject;
};

toffle.compileTemplate = function(template, initialTemplate){

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
	toffle.pendingTemplates.push(template.id);

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
			newToken = toffle.tokenify(newToken, template.id);	

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
	toffle.templates.push({
		name: template.id,
		temp: currentTemplate
		});
};

toffle.tokenify = function(token, currentTemplate) {
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
			for (var z = 0; z < toffle.pendingTemplates.length; z++)
			{
				if(toffle.pendingTemplates[z] == tokenObj.template)
				{
					templateIsCompiled = true;
					break;
				}
			}
			if((tokenObj.template != currentTemplate) && !templateIsCompiled)
			{
				toffle.compileTemplate(referencedTemplate, false);
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

		// FOR STATEMENT
		case "for":
			tokenObj = new toffle.tokenType.FOR();
			
			// Check we have enough sub tokens to form a valid 'for' statement.
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
					throw "toffle: Compilation failed! Incorrect 'for' declaration, missing 'in'.";
				}
			}
			else
			{
				// Not enough sub tokens to form a valid 'for' statement, Error.
				throw "toffle: Compilation failed! Incorrect 'for' declaration.";
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

	// Check for literal object
	if((param.charAt(0) == '{') && (param.charAt(param.length-1) == '}')) 
	{
		// Parse the object (toffle will only permit one level of json for param lists)
		param = JSON.parse(param);

		// Iterate over each value in the parameters and attempt to evaluate each.
		// set the actual value to be the output of the eval() method. This sounds crazy but if a value
		// happens to be a string that represents another json object then this will replace the string
		// with the actual object.
		for (var key in param) 
		{
			// Ensure the object literal has this property set.
			if (param.hasOwnProperty(key)) 
			{
				var evaluatedValue;

				try 
				{
					// TODO Eventually we will have to take security into account. Look into creating a 
					// a wrapper for eval with its own scope for variables. (Look into a javascript 
					// expression parser to append all object identifiers to a safe namespace 'toffle.$')
					evaluatedValue = eval(param[key]);
				}
				catch(err) 
				{
					// This is not an object reference, leave it be.
					evaluatedValue = param[key];
				}
				
				// Set the evaluated value
				param[key] = evaluatedValue;
			}
		}
		
		// Return our evaluated literal input.
		return param;
	}
	else
	{
		try
		{
			// TODO Eventually we will have to take security into account. Look into creating a 
			// a wrapper for eval with its own scope for variables. (Look into a javascript 
			// expression parser to append all object identifiers to a safe namespace 'toffle.$')
			var evaluatedValue = eval(param);

			// We didn't blow up evaluating that input. Return our spoils.
			return evaluatedValue;
		}
		catch(err)
		{
			throw "toffle: Error evaluating parameter input: " + param;
		}
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