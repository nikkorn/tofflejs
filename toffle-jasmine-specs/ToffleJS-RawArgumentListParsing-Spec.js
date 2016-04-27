describe("Raw Argument List Parsing", function() {

  beforeEach(function() { });
  
  it("should cope with an empty argument list", function() {
      var rawArgumentList    = "";
      var parsedArgumentList = toffle.parseRawArgumentList(rawArgumentList);
      expect(parsedArgumentList.length).toEqual(0);
  });
  
  function validRawArgumentLists(size) {
      var argList = "";
      var stringLiteralRegex = qc.string.matching(/^[a-zA-Z0-9_ @]+$/);
      var argListLength = qc.int.between(0,50)(50);
      // Randomly generate valid arguments to append to the argument list.
      for(var i = 0; i < argListLength; i++) {
          var argTypeId = qc.int.between(0,6)(6);
          switch(argTypeId) {
              case 0:
                  // append integer literal
                  argList = argList + qc.int.between(0, 10000)(10000) + ' ';
                  break;
              case 1:
                  // append true boolean literal
                  argList = argList + 'true ';
                  break;
              case 2:
                  // append false boolean literal
                  argList = argList + 'false ';
                  break;
              case 3:
                  // append null literal
                  argList = argList + 'null ';
                  break;
              case 4:
                  // append string literal wrapped in double quotes
                  var generatedStringLiteral = stringLiteralRegex(qc.int.between(0, 50)(50));
                  // Let's replace any '@' charaters with an escaped double quote. 
                  generatedStringLiteral = generatedStringLiteral.replace("@", '\\"');
                  argList = argList + '"' + generatedStringLiteral + '" ';
                  break;
              case 5:
                  // append string literal wrapped in single quotes
                  
                  var generatedStringLiteral = stringLiteralRegex(qc.int.between(0, 50)(50));
                  // Let's replace any '@' charaters with an escaped single quote. 
                  generatedStringLiteral = generatedStringLiteral.replace("@", "\\'");
                  argList = argList + "'" + generatedStringLiteral + "' ";
                  break;
          }
      }
      // Return an object containing our generated argument list along with the 
      // actual argument length that should match the output array length of parseRawArgumentList().
      return {
          rawArgList: argList,
          argListSize: argListLength
      };
  }
  
  it("should correctly parse a list of a varying number of arguments", function() {
      expect(function(validArgumentList) { 
          var parsedArgumentList = toffle.parseRawArgumentList(validArgumentList.rawArgList);
          return parsedArgumentList.length == validArgumentList.argListSize;
      }).forAll(validRawArgumentLists);
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