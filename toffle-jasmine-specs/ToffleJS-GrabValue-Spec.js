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
}); 