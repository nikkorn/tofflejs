describe("Template Execution", function() {
    
  it("generates expected ouptut when evaluating an empty template", function() {
      // Get our empty template from the DOM
      var emptyTemplate = document.getElementById('EmptyTemplate');
      // Pre-process our empty template.
      var preProcessedEmptyTemplate = toffle.template({
            template: emptyTemplate
      });
      // Evaluate our template, passing in empty dataset. we expect empty output.
      var result = preProcessedEmptyTemplate.go({});
      expect(result).toEqual("");
  });
});