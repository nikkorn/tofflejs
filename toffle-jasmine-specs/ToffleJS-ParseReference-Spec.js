describe("Parse Reference", function() {

    beforeEach(function() {
        // parseReference() is a function of the object which is returned after successfully
        // pre-processing a template. Do a basic pre-processing of an empty template to get it.
        this.preProcessedTemplatesObject = toffle.template({
            template: document.getElementById('EmptyTemplate')
        });
    });
    
    it("should cope with a single identifier", function() {
        var propertyName = "property";
        var parsedReference = this.preProcessedTemplatesObject.parseReference(propertyName);
        expect(parsedReference).toBeDefined();
        expect(parsedReference.idents.length).toEqual(1);
        expect(parsedReference.idents[0].name).toEqual(propertyName);
    });
    
    it("should cope with dot notation", function() {
        var parentObjectName = "object";
        var childPropertyName = "property";
        var composedPropertyAccessor = parentObjectName + "." + childPropertyName;
        var parsedReference = this.preProcessedTemplatesObject.parseReference(composedPropertyAccessor);
        expect(parsedReference).toBeDefined();
        expect(parsedReference.idents.length).toEqual(2);
        expect(parsedReference.idents[0].name).toEqual(parentObjectName);
        expect(parsedReference.idents[1].name).toEqual(childPropertyName);
    });
    
    describe("when dealing with bracket notation", function() {
        
        it("should cope with a nested property accessor 'object[property_accessor]'", function() {
            var parentObjectName = "object";
            var nestedReference = "property";
            var composedPropertyAccessor = parentObjectName + "[" + nestedReference + "]";
            var parsedReference = this.preProcessedTemplatesObject.parseReference(composedPropertyAccessor);
            expect(parsedReference).toBeDefined();
            expect(parsedReference.idents.length).toEqual(1);
            expect(parsedReference.idents[0].name).toEqual(parentObjectName);
            expect(parsedReference.idents[0].sub.length).toEqual(1);
            expect(parsedReference.idents[0].sub[0].name).toEqual(nestedReference);
        });
    
        it("should cope with a literal property name 'object[[property_name]]'", function() {
            var parentObjectName = "object";
            var literalPropertyName = "property";
            var composedPropertyAccessor = parentObjectName + "[[" + literalPropertyName + "]]";
            var parsedReference = this.preProcessedTemplatesObject.parseReference(composedPropertyAccessor);
            expect(parsedReference).toBeDefined();
            expect(parsedReference.idents.length).toEqual(2);
            expect(parsedReference.idents[0].name).toEqual(parentObjectName);
            expect(parsedReference.idents[1].name).toEqual(literalPropertyName);
            expect(parsedReference.idents[1].literal).toBeDefined();
            expect(parsedReference.idents[1].literal).toBe(true);
        });
    });
}); 