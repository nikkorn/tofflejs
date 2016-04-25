// Holder for all of our test spec definitions.
var testSpecRoot = []; 
var reporterPresent = false;
var reporter;

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
        printTestSpecDefinitionToReporter();
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

function printTestSpecDefinitionToReporter() {
	// Determine if the jasmine reporter has done its thing and we have output in the DOM.
	reporter = document.getElementsByClassName("jasmine_html-reporter")[0];
	if (typeof(reporter) != 'undefined' && reporter != null) {
	   reporterPresent = true;
	   appendToReporter("");
	   appendToReporter("IEEE 829 Test Specification");
	   appendToReporter("---------------------------");
	   appendToReporter("");
	} else {
	   // no reporter to append to. 
	   return;
	}

    for(var specIndex = 0; specIndex < testSpecRoot.length; specIndex++) {
        var currentSpec = testSpecRoot[specIndex];
        // print spec id
		appendToReporter("Unique Test ID   : " + currentSpec.specId);
        // print test name
		appendToReporter("Test Name        : " + currentSpec.specName);
        // print test element
		appendToReporter("Test Element     : " + currentSpec.testElement);
        // print valid and invalid response
		appendToReporter("Valid Response   : " + currentSpec.validResponse);
		appendToReporter("Invalid Response : " + currentSpec.invalidResponse);
        // print extended description (if there is one)
        if(currentSpec.desc != null) {
		    appendToReporter("Description cont.: " + currentSpec.desc);
        }
        appendToReporter("Last Run DT      : " + currentSpec.lastRunDT);
        appendToReporter("Last Run Result  : " + currentSpec.lastRunStatus);
        // print data items (if any were defined)
        if(currentSpec.dataItems.length > 0) {
		    appendToReporter("Data Items : ");
            for(var itemIndex = 0; itemIndex < currentSpec.dataItems.length; itemIndex++) {
                var currentDataItem = currentSpec.dataItems[itemIndex];
		        appendToReporter("    Item Name        : " + currentDataItem.dataItemName);
		        appendToReporter("    Item Type        : " + currentDataItem.dataItemType);
		        appendToReporter("    Item Description : " + currentDataItem.dataItemDesc);
		        appendToReporter("");
            }
        }
        // We want a gap between test desriptions.
		appendToReporter("");
    }
};

function appendToReporter(value) {
	if(reporterPresent) {
		reporter.innerHTML = reporter.innerHTML + value + "<br>";
	}
}
