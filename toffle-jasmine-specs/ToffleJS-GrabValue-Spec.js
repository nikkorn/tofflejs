describe("Grab Value", function() {
    var preProcessedTemplatesObject;

    beforeEach(function() {
        // Create a spy for the compileTemplate to stop it being called.
        toffle.compileTemplate = jasmine.createSpy("compileTemplate spy");
        // grabValue() is a function of the object which is returned after successfully
        // pre-processing a template. Do a basic pre-processing of an empty template to get it.
        preProcessedTemplatesObject = toffle.template({
            template: document.getElementById('EmptyTemplate')
        });
    });
    
    it("should return 'undefined' when passed an undefined parameters object", function() {
        var value = preProcessedTemplatesObject.grabValue(undefined, null);
        expect(value).not.toBeDefined();
    });
    
    it("should return the expected value when passed a reference with a single identifier", function() {
        var testName = "test_name";
        var testValue = "test_value";
        // Construct our mock data object containing the variable we want the value of. 
        var testValuesObject = {};
        testValuesObject[testName] = testValue;
        // Create the data structure that represents a property accessor.
        var testRerefenceStructure = [{ 
            name: testName, 
            sub: []
        }];
        // Attempt to get the value.
        var grabbedValue = preProcessedTemplatesObject.grabValue(testValuesObject, testRerefenceStructure);
        expect(grabbedValue).toEqual(testValue);
    });
}); 