describe("Template Pre-compilation", function() {
    
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
      
  });
  
  it("works correctly when processing an individual template with a NOT token", function() {
      
  });
  
  it("works correctly when processing an individual template with an EACH token", function() {
      
  });
  
  it("works correctly when processing an individual template with a HELPER token", function() {
      
  });
  
  it("works correctly when processing a template which references another template", function() {
      
  });
}); 

function populateDOMWithTemplateDefinitions() {
  var templateContainer = document.createElement("div");
  templateContainer.innerHTML = '<script id="EmptyTemplateWithArg" type="text/toffle-template" data-params="arg1"></script>' +
    '<script id="TemplateWithIF" type="text/toffle-template"><^ if trueCondition ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithNOT" type="text/toffle-template"><^ not falseCondition ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithEACH" type="text/toffle-template"><^ each x in someJSONArray ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithMATCH" type="text/toffle-template"><^ match x in ??helper someJSONArray ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithPLUG" type="text/toffle-template"><^ plug EmptyTemplate ^></script>' +
    '<script id="TemplateWithHELPER" type="text/toffle-template"><^ ??yIsTrue y ^>CONTENT<^/^></script>';
    document.body.appendChild(templateContainer);
};