describe("Raw Argument List Parsing", function() {

  beforeEach(function() { });
  
  it("should cope with an empty argument list", function() {
      var rawArgumentList    = "";
      var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
      expect(parsedArgumentList.length).toEqual(0);
  });
  
  it("should correctly parse a list of a varying number of arguments", function() {
         // TODO algebraic testing here!
  });
  
  describe("when processing strings", function() {
    
     it("should correctly parse an individual string wrapped in double quotes", function() {
         var rawArgumentList    = '"string-literal"';
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual('"string-literal"');
     });
     
     it("should correctly parse an individual string wrapped in single quotes", function() {
         var rawArgumentList    = "'string-literal'";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual("'string-literal'");
     });
     
     it("should correctly parse an individual string with surrounding whitespace", function() {
         var rawArgumentList    = '         "string-literal"        ';
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual('"string-literal"');
     });
     
     it("should not split arguments on whitespace in strings", function() {
         var rawArgumentList    = '"string literal"';
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual('"string literal"');
     });
     
     it("should recognise escaped double quote", function() {
         var rawArgumentList    = "'string\"literal'";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual("'string\"literal'");
     });
     
     it("should recognise escaped single quote", function() {
         var rawArgumentList    = '"string\'literal"';
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual('"string\'literal"');
     });
     
     it("should handle empty strings", function() {
         var rawArgumentList    = '""';
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toEqual('""');
     });
    
  });
  
  describe("when processing boolean literals", function() {
    
     it("should correctly parse a true boolean literal", function() {
         var rawArgumentList    = "true";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toBe(true);
     });
     
     it("should correctly parse a false boolean literal", function() {
         var rawArgumentList    = "false";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toBe(false);
     });
     
     it("should ignore the value of true when it is part of a string", function() {
         var rawArgumentList    = "'true'";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).not.toBe(true);
     });
     
     it("should ignore the value of false when it is part of a string", function() {
         var rawArgumentList    = "'false'";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).not.toBe(false);
     });
     
     it("should correctly parse a true boolean literal whith surrounding whitespace", function() {
         var rawArgumentList    = "       true       ";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toBe(true);
     });
     
     it("should correctly parse a false boolean literal whith surrounding whitespace", function() {
         var rawArgumentList    = "       false       ";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toBe(false);
     });
    
  });
  
  describe("when processing a null literal", function() {
    
     it("should correctly parse a null literal", function() {
         var rawArgumentList    = "null";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toBeNull;
     });
     
     it("should correctly parse a null literal whith surrounding whitespace", function() {
         var rawArgumentList    = "       null       ";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).toBeNull;
     });
     
     it("should ignore the value of null when it is part of a string", function() {
         var rawArgumentList    = "'null'";
         var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
         expect(parsedArgumentList.length).toEqual(1);
         expect(parsedArgumentList[0]).not.toBeNull;
     });
    
  });

});