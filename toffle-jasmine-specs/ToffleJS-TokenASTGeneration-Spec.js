describe("Token AST Generation", function() {

  beforeEach(function() { });
  
  it("should cope with an empty token list", function() {
      var emptyTemplate = { tokens: [] };
      var generatedAST  = toffle.generateTokenAST(emptyTemplate);
      expect(generatedAST.tokens).toBeDefined();
      expect(generatedAST.tokens.length).toEqual(0);
  });
  
  it("should cope with a misplaced closing token", function() {
      var emptyTemplate = { tokens: [] };
      var generatedAST  = toffle.generateTokenAST(emptyTemplate);
      expect(generatedAST.tokens).toBeDefined();
      expect(generatedAST.tokens.length).toEqual(0);
  });
  
  describe("when processing an token that wraps other tokens", function() {
      
      it("should cope with an unclosed token", function() {
          var ifToken = new toffle.tokenType.IF();
          var contentToken = new toffle.tokenType.CONTENT();
          var testTemplate = { tokens: [ ifToken, contentToken ] };
          var generatedAST  = toffle.generateTokenAST(testTemplate);
          expect(generatedAST.tokens).toBeDefined();
          expect(generatedAST.tokens.length).toEqual(0);
      });
      
      it("should wrap other tokens", function() {
              var wrappingToken = { tokens: [] , wrapsTokens: true }
              var contentToken = new toffle.tokenType.CONTENT();
              var closingToken = new toffle.tokenType.CLS();
              var testTemplate = { tokens: [ wrappingToken, contentToken, closingToken ] };
              var generatedAST  = toffle.generateTokenAST(testTemplate);
              expect(generatedAST.tokens).toBeDefined();
              // We should have our if token wrapping our content token.
              expect(generatedAST.tokens.length).toEqual(1);
              expect(generatedAST.tokens[0].tokens).toBeDefined;
              expect(generatedAST.tokens[0].tokens.length).toEqual(1);
              expect(generatedAST.tokens[0].tokens[0].type).toEqual("content");
      }); 
    
   });

}); 






