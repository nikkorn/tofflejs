describe("Template Pre-processing", function() {
    
  it("works correctly when processing an individual empty template", function() {
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="EmptyTemplate" type="text/toffle-template"></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var emptyTemplate = document.getElementById('EmptyTemplate');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(emptyTemplate, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("EmptyTemplate");
      // This template should be empty and contain no static content.
      expect(precompiledTemplatesList[0].temp.templateString).toEqual("");
      // This template should be empty not wrap any other tokens.
      expect(precompiledTemplatesList[0].temp.tokens.length).toEqual(0);
  });
  
  it("works correctly when processing a template with a property accessor", function() {
      var testRef = "TestRef";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithPropertyAccessor" type="text/toffle-template"><^ ' + testRef + ' ^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithAccessor = document.getElementById('TemplateWithPropertyAccessor');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithAccessor, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithPropertyAccessor");
      // This template should wrap our single reference token.
      expect(precompiledTemplatesList[0].temp.tokens.length).toEqual(1);
      expect(precompiledTemplatesList[0].temp.tokens[0].type).toEqual("ref");
      expect(precompiledTemplatesList[0].temp.tokens[0].value).toEqual(testRef);
  });

  it("works correctly when processing an individual template with static content", function() {
      var testContent = "CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithStaticContent" type="text/toffle-template">' + testContent + '</script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithContent = document.getElementById('TemplateWithStaticContent');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithContent, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithStaticContent");
      // This template should wrap a single content token.
      expect(precompiledTemplatesList[0].temp.tokens.length).toEqual(1);
      expect(precompiledTemplatesList[0].temp.tokens[0].type).toEqual("content");
      expect(precompiledTemplatesList[0].temp.tokens[0].value).toEqual(testContent);
  });
  
  it("works correctly when processing an individual template with an IF token", function() {
      var testCnd = "CONDITION";
      var testCnt = "CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithIF" type="text/toffle-template">' +
        '<^ if ' + testCnd + ' ^>' + testCnt + '<^/^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithIf = document.getElementById('TemplateWithIF');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithIf, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithIF");
      // We need to check the actual AST of our template to ensure its structure is valid.
      var templateAST = precompiledTemplatesList[0].temp.AST;
      // We should have only one token in the root our our AST, our IF token.
      expect(templateAST.tokens.length).toEqual(1);
      expect(templateAST.tokens[0].type).toEqual("if");
      expect(templateAST.tokens[0].condition).toEqual(testCnd);
      // Our IF token should be wrapping a content token that represents the static content
      // wrapped by the IF construct in our template.
      expect(templateAST.tokens[0].tokens.length).toEqual(1);
      expect(templateAST.tokens[0].tokens[0].type).toEqual("content");
      expect(templateAST.tokens[0].tokens[0].value).toEqual(testCnt);
  });
  
  it("works correctly when processing an individual template with a NOT token", function() {
      var testCnd = "CONDITION";
      var testCnt = "CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithNOT" type="text/toffle-template">' +
        '<^ not ' + testCnd + ' ^>' + testCnt + '<^/^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithNot = document.getElementById('TemplateWithNOT');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithNot, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithNOT");
      // We need to check the actual AST of our template to ensure its structure is valid.
      var templateAST = precompiledTemplatesList[0].temp.AST;
      // We should have only one token in the root our our AST, our NOT token.
      expect(templateAST.tokens.length).toEqual(1);
      expect(templateAST.tokens[0].type).toEqual("not");
      expect(templateAST.tokens[0].condition).toEqual(testCnd);
      // Our NOT token should be wrapping a content token that represents the static content
      // wrapped by the NOT construct in our template.
      expect(templateAST.tokens[0].tokens.length).toEqual(1);
      expect(templateAST.tokens[0].tokens[0].type).toEqual("content");
      expect(templateAST.tokens[0].tokens[0].value).toEqual(testCnt);
  });
  
  it("works correctly when processing an individual template with an EACH token", function() {
      var testTargetArray = "TESTARRAY";
      var testIteratorIdent = "TESTIDENT";
      var testCnt = "CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithEACH" type="text/toffle-template"><^ each '+
        testIteratorIdent + ' in ' + testTargetArray + ' ^>' + testCnt + '<^/^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithEach = document.getElementById('TemplateWithEACH');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithEach, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithEACH");
      // We need to check the actual AST of our template to ensure its structure is valid.
      var templateAST = precompiledTemplatesList[0].temp.AST;
      // We should have only one token in the root our our AST, our NOT token.
      expect(templateAST.tokens.length).toEqual(1);
      expect(templateAST.tokens[0].type).toEqual("each");
      expect(templateAST.tokens[0].pointer).toEqual(testIteratorIdent);
      expect(templateAST.tokens[0].reference).toEqual(testTargetArray);
      // Our EACH token should be wrapping a content token that represents the static content
      // wrapped by the EACH construct in our template.
      expect(templateAST.tokens[0].tokens.length).toEqual(1);
      expect(templateAST.tokens[0].tokens[0].type).toEqual("content");
      expect(templateAST.tokens[0].tokens[0].value).toEqual(testCnt);
  });
  
  it("works correctly when processing an individual template with a MATCH token", function() {
      var testTargetArray = "TESTARRAY";
      var testIteratorIdent = "TESTIDENT";
      var testHelper = "TESTHELPER";
      var testCnt = "CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithMATCH" type="text/toffle-template">' +
        '<^ match ' + testIteratorIdent + ' in ??' + testHelper + ' ' + testTargetArray + ' ^>' + 
        testCnt + '<^/^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithMatch = document.getElementById('TemplateWithMATCH');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithMatch, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithMATCH");
      // We need to check the actual AST of our template to ensure its structure is valid.
      var templateAST = precompiledTemplatesList[0].temp.AST;
      // We should have only one token in the root our our AST, our NOT token.
      expect(templateAST.tokens.length).toEqual(1);
      expect(templateAST.tokens[0].type).toEqual("match");
      expect(templateAST.tokens[0].pointer).toEqual(testIteratorIdent);
      expect(templateAST.tokens[0].reference).toEqual(testTargetArray);
      expect(templateAST.tokens[0].func).toEqual(testHelper);
      // Our MATCH token should be wrapping a content token that represents the static content
      // wrapped by the MATCH construct in our template.
      expect(templateAST.tokens[0].tokens.length).toEqual(1);
      expect(templateAST.tokens[0].tokens[0].type).toEqual("content");
      expect(templateAST.tokens[0].tokens[0].value).toEqual(testCnt);
  });
  
  it("works correctly when processing an individual template with a HELPER token", function() {
      var testHelper = "TESTHELPER";
      var testArguments = "TESTARG1 TESTARG2";
      var testCnt = "CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithHELPER" type="text/toffle-template"><^ ??' + 
        testHelper + ' ' + testArguments + ' ^>' + testCnt + '<^/^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithHelper = document.getElementById('TemplateWithHELPER');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithHelper, true, [], precompiledTemplatesList);
      // We are expecting a single precompiled template.
      expect(precompiledTemplatesList.length).toBe(1);
      expect(precompiledTemplatesList[0].name).toEqual("TemplateWithHELPER");
      // We need to check the actual AST of our template to ensure its structure is valid.
      var templateAST = precompiledTemplatesList[0].temp.AST;
      // We should have only one token in the root our our AST, our NOT token.
      expect(templateAST.tokens.length).toEqual(1);
      expect(templateAST.tokens[0].type).toEqual("helper");
      expect(templateAST.tokens[0].arguments).toEqual(testArguments);
      expect(templateAST.tokens[0].func).toEqual(testHelper);
      // Our HELPER token should be wrapping a content token that represents the static content
      // wrapped by the HELPER construct in our template.
      expect(templateAST.tokens[0].tokens.length).toEqual(1);
      expect(templateAST.tokens[0].tokens[0].type).toEqual("content");
      expect(templateAST.tokens[0].tokens[0].value).toEqual(testCnt);
  });
  
  it("works correctly when processing a template which references another template", function() {
      var testParams = "p1 p2 p3";
       // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      var tmp = '<script id="TemplateWithPLUG" type="text/toffle-template"><^ plug EmptyTemplate ' + 
        testParams + ' ^></script>';
      templateDiv.innerHTML = tmp;
      document.body.appendChild(templateDiv);
      // Get our template from the DOM
      var templateWithPlug = document.getElementById('TemplateWithPLUG');
      var precompiledTemplatesList = [];
      // Attempt to pre-compile the empty template.
      toffle.compileTemplate(templateWithPlug, true, [], precompiledTemplatesList);
      // We are expecting both our initial and referenced precompiled templates.
      expect(precompiledTemplatesList.length).toBe(2);
      expect(precompiledTemplatesList[0].name).toEqual("EmptyTemplate");
      expect(precompiledTemplatesList[1].name).toEqual("TemplateWithPLUG");
      // We need to check the actual AST of our template to ensure its structure is valid.
      var templateAST = precompiledTemplatesList[1].temp.AST;
      // We should have only one token in the root our our AST, our NOT token.
      expect(templateAST.tokens.length).toEqual(1);
      expect(templateAST.tokens[0].type).toEqual("template");
      expect(templateAST.tokens[0].template).toEqual("EmptyTemplate");
      expect(templateAST.tokens[0].params).toEqual(testParams);
  });
});