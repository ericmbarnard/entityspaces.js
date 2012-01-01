A Knockout/Javascript ORM
============================================

<table border="0">
	<tr>
		<td>
			<a href="http://www.entityspaces.net/developer/Videos/entityspaces_js/entityspaces_js_cool.html" target="new"><img src="http://www.entityspaces.net/downloads/video.png"></a>
		</td>
		<td>
			**Watch a video of entityspaces.js in action**
		</td>
	</tr>
<table>

The entityspaces.js syntax
============================================

Below is an example of real working code for the entityspaces.js and is the same code demonstrated in the video above. These code samples use our XMLHttpRequestProvider but we also provide an AjaxProvider for restful API's.

**Loading and Saving, Hierarchical Data, using Synchronous calls**

````javascript
<script language="javascript" type="text/javascript">

	es.dataProvider = new es.XMLHttpRequestProvider();
	es.dataProvider.baseURL = "http://www.entityspaces.net/Knockout/Part1/esService/esJson.svc/";

	// Load an employee with hierarchical model and save hierarchical data back to the server
	var emp = new es.objects.Employees();
	emp.loadByPrimaryKey(2);

	emp.FirstName("This");
	emp.OrdersCollectionByEmployeeID()[0].ShipCity(Math.random().toString().substr(0, 4));
	emp.save();

	// Collection load/save
	var coll = new es.objects.EmployeesCollection();
	coll.loadAll();

	coll()[0].FirstName("Rocks!!");
	coll.save();

</script>
````

**Adding New Records**

````javascript
<script language="javascript" type="text/javascript">

	es.dataProvider = new es.XMLHttpRequestProvider();
	es.dataProvider.baseURL = "http://www.entityspaces.net/Knockout/Part1/esService/esJson.svc/";

	// Add a single record
	var emp = new es.objects.Employees();
	emp.FirstName("Just");
	emp.LastName("Added");
	emp.save();

	// It's an autoincrement column and we get it back
	var employeeId = emp.EmployeeID();

	// Add two new employees through a collection
	var coll = new es.objects.EmployeesCollection();

	emp = new es.objects.Employees();
	emp.FirstName("Just1");
	emp.LastName("Added1");
	coll.push(emp);

	emp = new es.objects.Employees();
	emp.FirstName("Just2");
	emp.LastName("Added2");
	coll.push(emp);

	coll.save();

	// Check to make sure we got our autoincrement primary keys
	var employeeId_1 = coll()[0].EmployeeID();
	var employeeId_2 = coll()[1].EmployeeID();

</script>
````

**Deleting Records**

````javascript
<script language="javascript" type="text/javascript">

	es.dataProvider = new es.XMLHttpRequestProvider();
	es.dataProvider.baseURL = "http://www.entityspaces.net/Knockout/Part1/esService/esJson.svc/";

	// Add a single record
	var emp = new es.objects.Employees();
	emp.FirstName("Just");
	emp.LastName("Added");
	emp.save();

	var employeeId = emp.EmployeeID();

	// Reload the new record and delete it
	emp = new es.objects.Employees();
	emp.loadByPrimaryKey(employeeId);
	emp.markAsDeleted();
	emp.save();

	// Can we reload the deleted record
	emp = new es.objects.Employees();
	var loaded = emp.loadByPrimaryKey(employeeId);

	// The employeeId = undefined
	employeeId = emp.EmployeeID();

</script>
````

**Asychronous and or Synchronous methods**

While this sample might not makes sense asynchronously it does show that you can use the API in any fashion you desire.

````javascript
<script language="javascript" type="text/javascript">

	es.dataProvider = new es.XMLHttpRequestProvider();
	es.dataProvider.baseURL = "http://www.entityspaces.net/Knockout/Part1/esService/esJson.svc/";

	//----------------------------------------------------------
	// Here is a code snippet using the synchronous approach
	//----------------------------------------------------------
	var emp = new es.objects.Employees();
	emp.loadByPrimaryKey(2);
	emp.FirstName("sync" + "!!!");
	emp.save();

	var coll = new es.objects.EmployeesCollection();
	coll.loadAll();

	coll()[0].FirstName("Rocks!!");
	coll.save();

	//-----------------------------------------------------------------
	// Here is the same code from above using the asynchronous approach
	//-----------------------------------------------------------------
	var emp = new es.objects.Employees();
	emp.loadByPrimaryKey(2, function (data) {

		emp.FirstName("sync" + "!!!");

		emp.save(function (data) {

			var coll = new es.objects.EmployeesCollection();

			coll.loadAll(function (data) {

				coll()[0].FirstName("Rocks!!");

				coll.save(function (data) {

					var str = "Save is complete ...";
				});
			});
		});
	});

</script>
````

An entityspaces.js Entity and Collection
============================================

````javascript
<script language="javascript" type="text/javascript">

// *************************************************************************
// Generated by an EntitySpaces Tempate from the Northwind.Employees Table
// *************************************************************************

(function (es) { //myNS = "myNameSpace" ... for example purposes

	if (typeof (es) === undefined) {
		throw "Please Load EntitySpaces.Core First";
	}

	es.objects.Employees = es.defineEntity(function () {

		// core columns
		this.EmployeeID = ko.observable();
		this.LastName = ko.observable();
		this.FirstName = ko.observable();
		this.Title = ko.observable();
		this.TitleOfCourtesy = ko.observable();
		this.BirthDate = ko.observable();
		this.HireDate = ko.observable();
		this.Address = ko.observable();
		this.City = ko.observable();
		this.Region = ko.observable();
		this.PostalCode = ko.observable();
		this.Country = ko.observable();
		this.HomePhone = ko.observable();
		this.Extension = ko.observable();
		this.Photo = ko.observable();
		this.Notes = ko.observable();
		this.ReportsTo = ko.observable();
		this.PhotoPath = ko.observable();

		// extended colulmns
		this.esExtendedData;


		// Hierarchical Properties
		this.EmployeesCollectionByReportsTo;
		this.UpToEmployeesByReportsTo;
		this.UpToTerritoriesCollection;
		this.EmployeeTerritoriesCollectionByEmployeeID;
		this.OrdersCollectionByEmployeeID;

		this.esTypeDefs = {
			EmployeesCollectionByReportsTo: "EmployeesCollection",
			UpToEmployeesByReportsTo: "Employees",
			UpToTerritoriesCollection: "TerritoriesCollection",
			EmployeeTerritoriesCollectionByEmployeeID: "EmployeeTerritoriesCollection",
			OrdersCollectionByEmployeeID: "OrdersCollection"
		};
	});

	//#region Routing

	es.objects.Employees.prototype.routes = {
		commit: { method: 'PUT', url: 'Employees_Save', response: 'entity' },
		loadByPrimaryKey: { method: 'GET', url: 'Employees_LoadByPrimaryKey', response: 'entity' }
	};

	//#endregion
}(window.es, window.myNS));

(function (es) {

	es.objects.EmployeesCollection = es.defineCollection('EmployeesCollection', 'Employees');

	//#region Routing

	es.objects.EmployeesCollection.prototype.routes = {
		commit: { method: 'PUT', url: 'EmployeesCollection_Save', response: 'collection' },
		loadAll: { method: 'GET', url: 'EmployeesCollection_LoadAll', response: 'collection' }
	};

	//#endregion
}(window.es));

</script>
````