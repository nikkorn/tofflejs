describe("Tokeinfy", function() {

    beforeEach(function() { });
    
    it("should correctly process a raw closing token", function() {
        var rawClosingToken = "<^/^>";
        var processedToken = toffle.tokenify(rawClosingToken, null, null, null);
        expect(processedToken).toBeDefined();
        expect(processedToken.type).toEqual("cls");
    });
    
    describe("when processing a raw IF token", function() {
        
        it("should correctly return the expected IF token object", function() {
            var rawIfTokenCondition = "##";
            var rawIfToken = "<^ if " + rawIfTokenCondition + " ^>";
            var processedToken = toffle.tokenify(rawIfToken, null, null, null);
            expect(processedToken).toBeDefined();
            expect(processedToken.type).toEqual("if");
            expect(processedToken.condition).toEqual(rawIfTokenCondition);
         });
    
         it("should throw an error when not supplied a condition", function() {
            var rawConditionlessIfToken = "<^ if ^>";
            var expectedException = "toffle: Compilation failed! Missing 'if' condition.";
            expect(toffle.tokenify.bind(null, rawConditionlessIfToken, null, null, null)).toThrow(expectedException);
         });
    });
    
    describe("when processing a raw NOT token", function() {
        
        it("should correctly return the expected NOT token object", function() {
            var rawNotTokenCondition = "##";
            var rawNotToken = "<^ not " + rawNotTokenCondition + " ^>";
            var processedToken = toffle.tokenify(rawNotToken, null, null, null);
            expect(processedToken).toBeDefined();
            expect(processedToken.type).toEqual("not");
            expect(processedToken.condition).toEqual(rawNotTokenCondition);
        });
    
        it("should throw an error when not supplied a condition", function() {
            var rawConditionlessNotToken = "<^ not ^>";
            var expectedException = "toffle: Compilation failed! Missing 'not' condition.";
            expect(toffle.tokenify.bind(null, rawConditionlessNotToken, null, null, null)).toThrow(expectedException);
        });
    });
    
    describe("when processing a raw MATCH token", function() {
        
        it("should correctly return the expected MATCH token object", function() {
            var rawMatchTokenHelperIdentifier = "??helper";
            var rawMatchTokenIteratorIdentifier = "x";
            var rawMatchTokenTargetCollection = "y";
            var rawMatchToken = "<^ match " + rawMatchTokenIteratorIdentifier + " in " + rawMatchTokenHelperIdentifier 
                + " " + rawMatchTokenTargetCollection + " ^>";
            var processedToken = toffle.tokenify(rawMatchToken, null, null, null);
            expect(processedToken).toBeDefined();
            expect(processedToken.type).toEqual("match");
            expect(processedToken.pointer).toEqual(rawMatchTokenIteratorIdentifier);
            expect("??" + processedToken.func).toEqual(rawMatchTokenHelperIdentifier);
            expect(processedToken.reference).toEqual(rawMatchTokenTargetCollection);
        });
        
        it("should throw an error when missing the keyword 'in'", function() {
            var rawMatchTokenWithoutIf = "<^ match x ??helper y z ^>";
            var expectedException = "toffle: Compilation failed! Incorrect 'match' declaration, missing 'in'.";
            expect(toffle.tokenify.bind(null, rawMatchTokenWithoutIf, null, null, null)).toThrow(expectedException);
        });
        
        it("should throw an error when given an invalid helper identifier", function() {
            var invalidHelperIdentifier = "invalid";
            var rawInvalidHelperMatchToken = "<^ match x in " + invalidHelperIdentifier + " y ^>";
            var expectedException = "toffle: Compilation failed! Incorrect 'match' declaration, not a valid Helper identifier: " 
                + invalidHelperIdentifier;
            expect(toffle.tokenify.bind(null, rawInvalidHelperMatchToken, null, null, null)).toThrow(expectedException);
        });
    
        it("should throw an error when not supplied with at least 'match [identifier] in [helper] [collection]'", function() {
            var rawBrokenMatchToken = "<^ match ^>";
            var expectedException = "toffle: Compilation failed! Incorrect 'match' declaration.";
            expect(toffle.tokenify.bind(null, rawBrokenMatchToken, null, null, null)).toThrow(expectedException);
        });
    });
    
    describe("when processing a raw EACH token", function() {
        
        it("should correctly return the expected EACH token object", function() {
            var rawEachTokenIteratorIdentifier = "x";
            var rawEachTokenTargetCollection = "y";
            var rawEachToken = "<^ each " + rawEachTokenIteratorIdentifier + " in " + rawEachTokenTargetCollection + " ^>";
            var processedToken = toffle.tokenify(rawEachToken, null, null, null);
            expect(processedToken).toBeDefined();
            expect(processedToken.type).toEqual("each");
            expect(processedToken.pointer).toEqual(rawEachTokenIteratorIdentifier);
            expect(processedToken.reference).toEqual(rawEachTokenTargetCollection);
        });
        
        it("should throw an error when missing the keyword 'in'", function() {
            var rawEachTokenWithoutIf = "<^ each x y z ^>";
            var expectedException = "toffle: Compilation failed! Incorrect 'each' declaration, missing 'in'.";
            expect(toffle.tokenify.bind(null, rawEachTokenWithoutIf, null, null, null)).toThrow(expectedException);
        });
    
        it("should throw an error when not supplied with at least 'each [identifier] in [collection]'", function() {
            var rawBrokenEachToken = "<^ each ^>";
            var expectedException = "toffle: Compilation failed! Incorrect 'each' declaration.";
            expect(toffle.tokenify.bind(null, rawBrokenEachToken, null, null, null)).toThrow(expectedException);
        });
    });
    
    it("should correctly process a raw PLUG token", function() {
       // TODO
    });
    
    it("should correctly process a property accessor", function() {
       // TODO
    });
    
    describe("when dealing with helper function calls", function() {
        
        it("should cope with an empty argument list", function() {
            // TODO
        });
        
        it("should cope with a single argument", function() {
            // TODO
        });
        
         it("should cope with a multiple arguments", function() {
            // TODO Attempt algebraic testing
        });
    });
});