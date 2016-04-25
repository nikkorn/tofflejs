describe("Template Pre-compilation", function() {
    
  it("works correctly when processing an individual empty template", function() {
      var emptyTemplate = document.getElementById('EmptyTemplate');
      if(emptyTemplate == null) {
        populateDOMWithTemplateDefinitions();
        emptyTemplate = document.getElementById('EmptyTemplate');
      }
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
      
  });

  it("works correctly when processing an individual template with static content", function() {
      
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
  templateContainer.innerHTML = '<script id="EmptyTemplate" type="text/toffle-template"></script>' +
    '<script id="EmptyTemplateWithArg" type="text/toffle-template" data-params="arg1"></script>' +
    '<script id="TemplateWithPropertyAccessor" type="text/toffle-template"><^ testValue ^></script>' +
    '<script id="TemplateWithIF" type="text/toffle-template"><^ if trueCondition ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithNOT" type="text/toffle-template"><^ not falseCondition ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithEACH" type="text/toffle-template"><^ each x in someJSONArray ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithMATCH" type="text/toffle-template"><^ match x in ??helper someJSONArray ^>CONTENT<^/^></script>' +
    '<script id="TemplateWithPLUG" type="text/toffle-template"><^ plug EmptyTemplate ^></script>' +
    '<script id="TemplateWithHELPER" type="text/toffle-template"><^ ??yIsTrue y ^>CONTENT<^/^></script>';
    document.body.appendChild(templateContainer);
};