```
PIP: -1
Title: Renovation of JSON RPC API
Type: ?
Impact: API
Author: Benjamin Ansbach <benjaminansbach@gmail.com>
Comments-URI: ?
Status: Draft
Created: 2018-04-2
```

## Summary

It is proposed to implement a revised version of the JSON RPC interface and it's objects returned by requests.

## Motivation

While the JSON RPC API in it's current state works as intended, it's obvious that it is a historically grown solution that lacks a lot of organization and reliable standards throughout it's implementation. 

To drive adoption of the currency by the developer community and open up the technology to a broader audience without the knowledge of the Pascal language, it is essential to provide an API that is clear, concise and easy to use.

## Specification

This specifications goal is to provide a set of rules as well as the definitions of the remote procedures.

### Naming convention

This proposal introduces naming conventions for objects as well as methods to create a clear path for developers on how one can identify the intend of methods as well as guess the meaning of fields defined in responses.

There are no expressed naming conventions in the jsonrpc specification itself, just the 4 predefined fields `jsonrpc`, `method`, `params` and `id`. What we can derive from these fields is that all fields should be lowercase. But that's all.

This specification defines the following rules for the naming of fields in JSON RPC responses as well as methods.

- Property names should be meaningful names with defined semantics.
- Property names must be snake-cased, ascii strings.
- The first character must be a letter
- Subsequent characters can be a letter or an underscore.
- Words typically reserved in programming languages should be avoided (e.g. `if`, `delete`, `while`, ..). There is no definite list available, just make sure it follows common knowledge.

### API versioning and Consistency

This is the most complicated part. The responses returned by the JSON RPC interface should follow a pre-defined set of rules to avoid having breaking changes on a new release. The JSON format allows us to de-serialize whatever we want, but the rules to change the format should be defined.

It should be possible for an object to evolve by removing or adding additional fields, but depending on the impact different rules apply:

- When a field is added, it is per se **not** a breaking change. The client library either handles the new value or not. JSON De-Serializers normally won't break. Client libraries need to make sure that all unknown fields are handled properly or are ignored.
- When a field is removed, it **is** a breaking change. The client library might parse the values to trigger further logic.
- When a field is renamed, it is the same as when a field is removed. So it **is** a breaking change.
- When the logic of how a fields value is calculated changes, it **might** be a breaking change. If it's a bugfix, it's fine. If the value does not coherent to another value, it's fine too. Developers have to decide.
- When a field is added but other fields rely on the newly added field, it **is** a breaking change.

Objects should never vary in it's presentation. For example, given the dynamics of an operation, the representation of this type can vary. At the current state, fields are added and removed dynamically depending on the type of operation. This will be addressed by defining fields that can contain different types of sub-objects. These fields will always be available but may contain different values.

### Type and parameter consistency

There are several fields and parameters which serve a common purpose and should be re-used in the same manner on each and every method call. 

Fields:

- **account**
  An account number. It will never contain the checksum value and is always an integer.
- **block**
  The number of a block, always and integer.
- **op_hash**
  A hex string, therefore only containing uppercase letters from `A-F` and `0-9`.
- **public_key**
  A hex string containing the public key.

Methods:

- **find**
  Whenever a unique identifier of an object is known and there is a method available to fetch the object, the method will be named `find`.

 

#### Multi-Usage of fields

If a field type is used multiple times, it will be prefixed with the predefined name and suffixed by the by it's description (`field_description`). 

For example: `account_seller`, `account_signer`, `account_destination` and so on.

#### Prices

All prices (fee, transaction, rewards, ...) will be formatted in the smallest unit available (PASC * 10000). The prices need to be returned as a string, as they can exceed 32 bits.

```json
{
  "price_wrong": 10000,
  "price_correct: "10000"
}
```

#### Paging

Some results are truncated and paged, the following fields are used to define the paging. 

- **start [default = 0]**
  The start parameter defines the start position of the truncated result set.
- **max**
  The max parameter defines the number of items of the truncated result set. The default value can differ from implementation to implementation, but `0` always means that all results are returned. If `0` as a value is not available, the documentation should state it clearly.

### Method categorization

To create a better overview of the JSON-RPC API itself, we will start by logically categorizing all available methods and rename them so that the name of the category will not be part of the actual name of the method. We will use a dot `.` to make the categorization, the HTTP endpoint will stay the same (http://ip:port).

The name of a category suffixed with the name of the method, divided by a `.` dot: `category.method`. 

#### Re-Organizing

With the features currently available in the API (`V2`), we can divide the methods in the following categories:

##### node namespace

This category contains all methods related to the administration of the node. The following methods fall into this category:

- `addnode(string nodes)`
  `->` `node.add_nodes(array<string>[] nodes)` 
- `nodestatus`
  `->` `node.status`
- `getconnections`
  `->` `node.connections`
- `stopnode`
  `->` `node.stop`
- `startnode`
  `->` `node.start` 

##### blocks

This category contains all methods related to blocks in the blockchain. The following methods fall into this category:

- `getblock(int block)`

  `->` `blocks.find(int block)`

- `getblocks(int last, int start, int end)` 
  `->` `blocks.last(int lookBack)`
  `->` `blocks.list(int start, int max)` 

- `getblockcount()`
  `->` `blocks.count()`

##### block

- `getblockoperation(block, opblock)` 
  removed
- `getblockoperations(int block, int start = 0, int max = 100)`
  `->` `block.operations(int block, int start = 0, int max = 100)` 

##### accounts

This category contains all methods related to accounts (PASA). The following methods fall into this category:

- `findaccounts(string name, int type, int start = 0, int max = 100)`

  `->` `accounts.search(string name = null, int type = null, int start = 0, int max = 100)` 

**account**

This category contains all methods related to a single account in the blockchain (PASA). The following methods fall into this category:

- `getaccount(int account)`

  `->` `account.find(int account)` 

- `getaccountoperations(int account, int depth = 100, int start = 0, int max = 100)` 

  `->` `account.operations(int account, int start = 0, int max = 100)` 

  `->` `account.recent_operations(int account, int loopBack = 100)` 

- `findaccounts(string name, int type, int start = 0, int max = 100)`
  `->` `account.se


- listaccountforsale
- delistaccountforsale
- changekey
- changeaccountinfo
- sendto
- buyaccount
- changeaccountinfo

**wallet**

This category contains all methods related to the wallet managed by the node. The following methods fall into this category:

- getwalletaccounts
- getwalletaccountscount
- getwalletpubkeys
- getwalletpubkey
- setwalletpassword
- getwalletcoins
- addnewkey
- changekeys
- executeoperations
- lock
- unlock

**operation**

- getpendings
- findoperation
- operationsinfo

**sign**

- signsendto
- signchangekey
- signlistaccountforsale
- signdelistaccountforsale
- signbuyaccount
- signchangeaccountinfo

**convertion**

- encodepubkey
- decodepubkey
- payloadencrypt
- payloaddecrypt



## Rationale

Discussion why was the specification was chosen over alternate designs. Evidence supporting the specification should be provided here, as well as community concerns and consensus.

## Backwards Compatibility

Any backwards incompatibilities should be described here, as well as work-arounds/solutions for these incompatibilities.

## Reference Implementation

The reference implementation must be provided before PIP is Completed.

## Links

References and links to relevant material