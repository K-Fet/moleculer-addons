"use strict";

const { ServiceBroker } = require("moleculer");
const Adapter = require("../../src/adapter");

describe("Test Adapter constructor", () => {
	it("should be created", () => {
		const adapter = new Adapter();
		expect(adapter).toBeDefined();
	});
});

describe("Test Adapter methods", () => {
	const broker = new ServiceBroker();
	const service = broker.createService({
		name: "test"
	});

	const adapter = new Adapter();
	adapter.init(broker, service);

	it("should connect", () => {
		return expect(adapter.connect()).resolves.toBeUndefined();
	});

	const doc = { 
		name: "Walter White", 
		age: 48, 
		email: "heisenberg@gmail.com" 
	};

	let savedDoc;

	it("should insert a document", () => {
		return adapter.insert(doc)
		.then(res => {
			expect(res).toEqual(Object.assign({}, doc, { _id: jasmine.any(String) }));
			savedDoc = res;
		}).catch(err => expect(err).toBe(true));
	});

	let multipleDocs;
	it("should insert multiple document", () => {
		return adapter.insertMany([{ name: "John Doe", c: true, age: 41 }, { name: "Jane Doe", b: "Hello", age: 35 }, { name: "Adam Smith", email: "adam.smith@gmail.com", age: 35 }])
		.then(res => {
			expect(res.length).toBe(3);
			expect(res[0]._id).toBeDefined();
			expect(res[0].name).toBe("John Doe");
			expect(res[0].age).toBe(41);

			expect(res[1]._id).toBeDefined();
			expect(res[1].name).toBe("Jane Doe");
			expect(res[1].age).toBe(35);

			expect(res[2]._id).toBeDefined();
			expect(res[2].name).toBe("Adam Smith");
			expect(res[2].email).toBe("adam.smith@gmail.com");
			expect(res[2].age).toBe(35);

			multipleDocs = res;
		}).catch(err => expect(err).toBe(true));
	});

	it("should find by ID", () => {
		return expect(adapter.findById(savedDoc._id)).resolves.toEqual(savedDoc);
	});

	it("should find by multiple ID", () => {
		return expect(adapter.findByIds([multipleDocs[0]._id, multipleDocs[1]._id, ])).resolves.toEqual([multipleDocs[0], multipleDocs[1]]);
	});

	it("should find all without filter", () => {
		return adapter.findAll().then(res => {
			expect(res.length).toBe(4);
		}).catch(err => expect(err).toBe(true));
	});

	it("should find all 'name' with raw query", () => {
		return expect(adapter.findAll({ query: { name: "John Doe" }})).resolves.toEqual([multipleDocs[0]]);
	});

	it("should find all 'age: 35'", () => {
		return adapter.findAll({ query: { age: 35 }}).then(res => {
			expect(res.length).toBe(2);
			expect(res[0].age).toEqual(35);
			expect(res[1].age).toEqual(35);

		}).catch(err => expect(err).toBe(true));
	});

	it("should find all 'Doe'", () => {
		return adapter.findAll({ search: "Doe" }).then(res => {
			expect(res.length).toBe(2);
			expect(res[0].name).toMatch("Doe");
			expect(res[1].name).toMatch("Doe");

		}).catch(err => expect(err).toBe(true));
	});

	it("should find all 'Doe' in filtered fields", () => {
		return adapter.findAll({ search: "Doe", searchFields: ["email"] }).then(res => {
			expect(res.length).toBe(0);
		}).catch(err => expect(err).toBe(true));
	});

	it("should find all 'walter' in filtered fields", () => {
		return adapter.findAll({ search: "walter", searchFields: "email name" }).then(res => {
			expect(res.length).toBe(1);
			expect(res[0]).toEqual(savedDoc);

		}).catch(err => expect(err).toBe(true));
	});

	it("should count all 'walter' in filtered fields", () => {
		return expect(adapter.count({ search: "walter", searchFields: "email name" })).resolves.toBe(1);
	});

	it("should sort the result", () => {
		return expect(adapter.findAll({ sort: "name" })).resolves.toEqual([
			multipleDocs[2],
			multipleDocs[1],
			multipleDocs[0], 
			savedDoc,
		]);
	});

	it("should sort by two fields in string", () => {
		return expect(adapter.findAll({ sort: "age -name" })).resolves.toEqual([
			multipleDocs[1],
			multipleDocs[2],
			multipleDocs[0], 
			savedDoc,
		]);
	});

	it("should sort by two fields in array", () => {
		return expect(adapter.findAll({ sort: ["-age", "-name"] })).resolves.toEqual([
			savedDoc,
			multipleDocs[0], 
			multipleDocs[1],
			multipleDocs[2],
		]);
	});

	it("should limit & skip the result", () => {
		return expect(adapter.findAll({ sort: ["-age", "-name"], limit: 2, offset: 1 })).resolves.toEqual([
			multipleDocs[0],
			multipleDocs[1],
		]);
	});

	it("should count all entities", () => {
		return expect(adapter.count()).resolves.toBe(4);
	});

	it("should count filtered entities", () => {
		return expect(adapter.count({ query: { email: { $exists: true } }})).resolves.toBe(2);
	});

	it("should update a document", () => {
		return expect(adapter.updateById(savedDoc._id, { $set: { e: 1234 } })).resolves.toEqual(Object.assign({}, savedDoc, { e: 1234 }));
	});	

	it("should update many documents", () => {
		return adapter.update({
			query: { age: 35 }, 
			update: { $set: { gender: "male" } }
		}).then(res => {
			expect(res.length).toBe(2);
			expect(res[0].gender).toBe("male");
			expect(res[1].gender).toBe("male");
		}).catch(err => expect(err).toBe(true));		
	});	

	it("should remove by ID", () => {
		return expect(adapter.removeById(multipleDocs[0]._id)).resolves.toBe(1);
	});	

	it("should remove many documents", () => {
		return expect(adapter.remove({
			query: { name: { $regex: /Doe/ } }
		})).resolves.toBe(1);
	});	

	it("should count all entities", () => {
		return expect(adapter.count()).resolves.toBe(2);
	});	

	it("should clear all documents", () => {
		return expect(adapter.clear()).resolves.toBe(2);
	});	

	it("should disconnect", () => {
		return expect(adapter.disconnect()).resolves.toBeUndefined();
	});	
});
