describe("Template Execution", function() {
    
  it("generates expected ouptut when evaluating an empty template", function() {
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestEmptyTemplate" type="text/toffle-template"></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var emptyTemplate = document.getElementById('FuncTestEmptyTemplate');
      // Pre-process our empty template.
      var preProcessedTemplate = toffle.template({
            template: emptyTemplate
      });
      // Evaluate our template, passing in empty dataset. we expect empty output.
      var result = preProcessedTemplate.go({});
      expect(result).toEqual("");
  });
  
  it("generates expected ouptut when evaluating a template wrapping static content", function() {
      var testStaticContent = "STATIC_CONTENT";
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestTemplateWithStaticContent" type="text/toffle-template">' +
        testStaticContent + '</script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var initialTemplate = document.getElementById('FuncTestTemplateWithStaticContent');
      // Pre-process our empty template.
      var preProcessedTemplate = toffle.template({
            template: initialTemplate
      });
      // Evaluate our template, passing in empty dataset. We expect our static content as output.
      var result = preProcessedTemplate.go({});
      expect(result).toEqual(testStaticContent);
  });
  
  it("generates expected ouptut when evaluating a template wrapping static content and reference statements", function() {
      var testPreIdentContent = "IDENT:";
      var testPreIDContent = "ID:";
      // Define an input context.
      var testInputContext = {
            ident: "context",
            info: {
                    id: 0
            }
      };
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestTemplateWithStaticContentAndRefs" type="text/toffle-template">' +
        testPreIdentContent + '<^ ident ^>' + testPreIDContent + '<^ info.id ^></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var initialTemplate = document.getElementById('FuncTestTemplateWithStaticContentAndRefs');
      // Pre-process our empty template.
      var preProcessedTemplate = toffle.template({
            template: initialTemplate
      });
      // Evaluate our template, passing our test context. We expect the correct interpolated output.
      var result = preProcessedTemplate.go(testInputContext);
      expect(result).toEqual(testPreIdentContent + testInputContext.ident + 
        testPreIDContent + testInputContext.info.id);
  });
  
  it("generates expected ouptut when evaluating a template wrapping IF statements", function() {
      var testFirstIfWrappedContent = "FIRST";
      var testSecondIfWrappedContent = "SECOND";
      // Define an input context.
      var testInputContext = {
            cond1: false,
            cond2: true
      };
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestTemplateWithIfs" type="text/toffle-template">' +
      '<^ if cond1 ^>' + testFirstIfWrappedContent + '<^/^>' +
      '<^ if cond2 ^>' + testSecondIfWrappedContent + '<^/^></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var initialTemplate = document.getElementById('FuncTestTemplateWithIfs');
      // Pre-process our empty template.
      var preProcessedTemplate = toffle.template({
            template: initialTemplate
      });
      // Evaluate our template, passing our test context. We expect the correct interpolated output. This
      // would be the content wrapped by the if statement which has a condition that evaluates to true.
      var result = preProcessedTemplate.go(testInputContext);
      // We are only expecting the second condition to evaluate to true.
      expect(result).toEqual(testSecondIfWrappedContent);
  });
  
  it("generates expected ouptut when evaluating a template wrapping NOT statements", function() {
      var testFirstNotWrappedContent = "FIRST";
      var testSecondNotWrappedContent = "SECOND";
      // Define an input context.
      var testInputContext = {
            cond1: false,
            cond2: true
      };
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestTemplateWithNots" type="text/toffle-template">' +
      '<^ not cond1 ^>' + testFirstNotWrappedContent + '<^/^>' + 
      '<^ not cond2 ^>' + testSecondNotWrappedContent + '<^/^></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var initialTemplate = document.getElementById('FuncTestTemplateWithNots');
      // Pre-process our empty template.
      var preProcessedTemplate = toffle.template({
            template: initialTemplate
      });
      // Evaluate our template, passing our test context. We expect the correct interpolated output. This
      // would be the content wrapped by the not statement which has a condition that evaluates to false.
      var result = preProcessedTemplate.go(testInputContext);
      // We are only expecting the first condition to evaluate to true.
      expect(result).toEqual(testFirstNotWrappedContent);
  });
  
  it("generates expected ouptut when evaluating a template wrapping helper functions", function() {
      var testFirstHelperWrappedContent  = "FIRST";
      var testSecondHelperWrappedContent = "SECOND";
      var testThirdHelperWrappedContent  = "THIRD";
      var testFourthHelperWrappedContent = "FOURTH";
      // Define an input context.
      var testInputContext = {
            var1: -1,
            var2: 5,
            var3: 0,
            var4: 1
      };
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestTemplateWithHelpers" type="text/toffle-template">' +
      '<^ ??isGreaterThanZero var1 ^>' + testFirstHelperWrappedContent + '<^/^>' + 
      '<^ ??isGreaterThanZero var2 ^>' + testSecondHelperWrappedContent + '<^/^>' + 
      '<^ ??isGreaterThanZero var3 ^>' + testThirdHelperWrappedContent + '<^/^>' + 
      '<^ ??isGreaterThanZero var4 ^>' + testFourthHelperWrappedContent + '<^/^></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var initialTemplate = document.getElementById('FuncTestTemplateWithHelpers');
      // Pre-process our empty template and define the helper function we are using to test.
      var preProcessedTemplate = toffle.template({
            template: initialTemplate,
            helpers: {
                isGreaterThanZero: function(value){
                    return value > 0;
                }
            }
      });
      // Evaluate our template, passing our test context. We expect the correct interpolated output. This
      // would be the content wrapped by the helper statements which return true based on some input argument/s.
      var result = preProcessedTemplate.go(testInputContext);
      // We are only expecting the second and fourth helper function to evaluate to true.
      expect(result).toEqual(testSecondHelperWrappedContent + testFourthHelperWrappedContent);
  });
  
  it("generates expected ouptut when evaluating a template wrapping EACH statements", function() {
      // Define an input context.
      var testInputContext = {
          testArray: [{
                    ID: 0,
                    val: "ZERO"
                },
                {
                    ID: 1,
                    val: "ONE"
                },
                {
                    ID: 2,
                    val: "TWO"
                }]
      };
      // We must append our template HTML element to the DOM.
      var templateDiv = document.createElement("div");
      templateDiv.innerHTML = '<script id="FuncTestTemplateWithEACH" type="text/toffle-template">' +
        '<^ each element in testArray ^><^ element.ID ^>:<^ element.val ^><^/^></script>';
      document.body.appendChild(templateDiv);
      // Get our empty template from the DOM
      var initialTemplate = document.getElementById('FuncTestTemplateWithEACH');
      // Pre-process our empty template and define the helper function we are using to test.
      var preProcessedTemplate = toffle.template({
            template: initialTemplate
      });
      // Evaluate our template, passing our test context. We expect the correct interpolated output. This
      // would be the content wrapped by the each statement, processed for each element in the defined array.
      var result = preProcessedTemplate.go(testInputContext);
      // Concatenate our expected result.
      var expectedResult = testInputContext.testArray[0].ID + ":" + testInputContext.testArray[0].val +
      testInputContext.testArray[1].ID + ":" + testInputContext.testArray[1].val +
      testInputContext.testArray[2].ID + ":" + testInputContext.testArray[2].val;
      expect(result).toEqual(expectedResult);
  });
});