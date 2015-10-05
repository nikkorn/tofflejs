# ToffleJS
ToffleJS is a light-weight templating tool written in pure javascript.

It is a light-weight javascript templating engine that gives you the power to generate HTML output using pre-defined toffle templates. It takes the hassle out of parsing JSON based datasets and lets you put your feet up while it quickly generates 
markup for you using the powerful built-it ToffleJS parsing tools, keeping your javascript and HTML nicely decoupled.

## How about an example?
We start off with a JSON dataset. This JSON defines the data that will be run through our template. In this case we have a simple dataset that contains a little information about me.

```
var json = {
	fName:"Nikolas",
	sName:"Howard",
	age:25,
	pets:[
		{
			name:"Wilfred",
			cutenessLevel: 6
		},
		{
			name:"Scrabbles",
			cutenessLevel: 4
		},
		{
			name:"Neighbour Cat",
			cutenessLevel: 1
		}
	]
};
```
We also need to create a toffle template in our markup, this template defines both our output markup and logic that handles our input JSON dataset.
```
<script id="myInfoTemplate" type="text/toffle-template">
	<h1>First Name:</h1>
	<h2> <^ input.fName ^> </h2>
	<br>
	
	<h1>Second Name:</h1>
	<h2> <^ input.sName ^> </h2>
	<br>
	
	<h3>Pets:</h3>
	<^ each pet in input.pets ^> 
		<^ plug petTemplate pet input.fName ^>
	<^/^>
	
	<h3>Age</h3>
	<p> <^ input.age ^> </p>
	<br>
</script>
```
You will notice the plain old HTML that we have sitting in this template. However there is also syntax that defines our tofflejs components, which are wrapped with an opening '<^' and a closing '^>'.</p><br><p> You may also 
notice that we mention another template named 'petTemplate'. Using the 'plug' tofflejs component we can reference other toffle templates and pass portions of our JSON dataset as a parameter (in this case the current 'pet' object). You can see this template below.
```
<script id="petTemplate" type="text/toffle-template" data-params="petInfo|owner">
	<hr>
	<p>Pet Owner: <^ owner ^></p>
	<p>Name: <^ petInfo.name ^></p>
	<p>Cuteness Level: <^ petInfo.cutenessLevel ^></p>
	<hr>
</script>
```
Now we want to generate some HTML. To do this we first have to compile our 'myInfoTemplate' template by calling 'toffle.template()' and passing our template DOM element object as an argument. If all goes well the function
should return our compiled template.</p><p>Note that you do not need to compile every tofflejs template that you wish to use in this way, compiling one template will recursively compile any other tofflejs templates that it references.
```
var myCompiledTemplate = toffle.template({ 
	template: document.getElementById("myInfoTemplate") 
});
var output = myCompiledTemplate.go({ input: json }); 
document.getElementById("MainWindow").innerHTML = output;
```
As shown in the code snippet above, we call the 'go()' method on our compiled template in order to generate our required output, we also have to pass in our JSON dataset as an argument.
Our output HTML:

<div id='exampleoutput'>
<h1>First Name:</h1>
<h2>Nikolas</h2>

<h1>Second Name:</h1>
<h2>Howard</h2>

<h3>Pets:</h3>
	
<hr>
<p>Pet Owner: Nikolas</p>
<p>Name: Wilfred</p>
<p>Cuteness Level: 6</p>
<hr>
	
<hr>
<p>Pet Owner: Nikolas</p>
<p>Name: Scrabbles</p>
<p>Cuteness Level: 4</p>
<hr>
	
<hr>
<p>Pet Owner: Nikolas</p>
<p>Name: Neighbour Cat</p>
<p>Cuteness Level: 1</p>
<hr>

<h3>Age</h3>
<p>25</p><br>
</div>
