describe("Grab Value", function() {
    var preProcessedTemplatesObject;

    beforeEach(function() {
        // grabValue() is a function of the object which is returned after successfully
        // pre-processing a template. Do a basic pre-processing of an empty template to get it.
        preProcessedTemplatesObject = toffle.template({
            template: document.getElementById('EmptyTemplate')
        });
    });
    
}); 