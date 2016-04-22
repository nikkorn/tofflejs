// Holder for all of our test spec definitions.
var testSpecRoot = []; 

jasmine.getEnv().addReporter({
    jasmineStarted: function () {
        testSpecRoot = []; 
    },
    specStarted: function (result) {
        testSpecRoot[testSpecRoot.length] = {
            specId: result.id,
            specName: result.fullName,
            testElement: "not defined",
            validResponse: "not defined",
            invalidResponse: "not defined",
            dataItems: [],
            desc: null,
            lastRunDT: "incomplete",
            lastRunStatus: "unknown"
        };
    },
    specDone: function (result) {
        testSpecRoot[testSpecRoot.length - 1].lastRunDT =  new Date().toString();
        testSpecRoot[testSpecRoot.length - 1].lastRunStatus = result.status;
    },
    jasmineDone: function () {
        printTestSpecDefinitionToConsole();
    }
});

function defineDescription(description) {
    if(description !== "undefined") {
        testSpecRoot[testSpecRoot.length - 1].desc = description;
    }
};

function defineValidResponse(response) {
    if(response !== "undefined") {
        testSpecRoot[testSpecRoot.length - 1].validResponse = response;
    }
};

function defineInvalidResponse(response) {
    if(response !== "undefined") {
        testSpecRoot[testSpecRoot.length - 1].invalidResponse = response;
    }
};

function defineTestElement(testElement) {
    if(testElement !== "undefined") {
        testSpecRoot[testSpecRoot.length - 1].testElement = testElement;
    }
};

function defineData(dataItemName, dataItemType, desc) {
    if(dataItemName !== "undefined" && dataItemType !== "undefined" && desc !== "undefined") {
        var currentTestSpec = testSpecRoot[testSpecRoot.length - 1];
        currentTestSpec.dataItems[currentTestSpec.dataItems.length] = {
            dataItemName: dataItemName,
            dataItemType: dataItemType,
            dataItemDesc: desc
        }
    }
};

function printTestSpecDefinitionToConsole() {
    for(var specIndex = 0; specIndex < testSpecRoot.length; specIndex++) {
        var currentSpec = testSpecRoot[specIndex];
        // print spec id
        console.log("Unique Test ID   : " + currentSpec.specId);
        // print test name
        console.log("Test Name        : " + currentSpec.specName);
        // print test element
        console.log("Test Element     : " + currentSpec.testElement);
        // print valid and invalid response
        console.log("Valid Response   : " + currentSpec.validResponse);
        console.log("Invalid Response : " + currentSpec.invalidResponse);
        // print extended description (if there is one)
        if(currentSpec.desc != null) {
            console.log("Description cont.: " + currentSpec.desc);
        }
        console.log("Last Run DT      : " + currentSpec.lastRunDT);
        console.log("Last Run Result  : " + currentSpec.lastRunStatus);
        // print data items (if any were defined)
        if(currentSpec.dataItems.length > 0) {
            console.log("Data Items : ");
            for(var itemIndex = 0; itemIndex < currentSpec.dataItems.length; itemIndex++) {
                var currentDataItem = currentSpec.dataItems[itemIndex];
                console.log("    Item Name        : " + currentDataItem.dataItemName);
                console.log("    Item Type        : " + currentDataItem.dataItemType);
                console.log("    Item Description : " + currentDataItem.dataItemDesc);
                console.log();
            }
        }
        // We want a gap between test desriptions.
        console.log();
    }
};