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

<!-- toc -->

## Summary

It is proposed to implement a revised version of the JSON RPC API and it's objects returned by requests.

## Motivation

While the JSON RPC API in it's current state works as intended, it's obvious that it is a historically grown solution that lacks a lot of organization and reliable standards throughout it's implementation. 

To drive adoption of the currency by the developer community and open up the technology to a broader audience without the knowledge of the Pascal language, it is essential to provide an API that is clear, concise, easy to use and tested.



## Specification

The goal of this PIP is to provide a set of rules as well as the definitions of the JSON-RPC methods implemented in the PascalCoin Node server (`TODO: name?`). It will be a complete overhaul of the current implementation and backwards compatibility is only achieved by letting the old implementation active for a defined period of time when it gets abandoned completely.



### JSON-Schema

There are a lot API-documentation tools out there, but they all lack the ability to create a specification for an  API using JSON RPC. The best way to describe such an API is to use the JSON Schema Vocabulary. It provides a way to describe JSON and is capable to define the complete API of PascalCoin.

Since it's an open standard and there are a lot of json-schema libraries out there, the resulting schema can be used to automatically create the documentation, write/execute/evaluate tests or even generate api-clients in more or less any language which can communicate via HTTP.



### Naming convention

This proposal introduces naming conventions for object properties as well as methods to create a clear path for developers on how one can identify the intend of methods and guess the meaning of fields defined in either the method parameters and the responses.

There are no expressed naming conventions in the jsonrpc specification itself, just the 4 predefined fields `jsonrpc`, `method`, `params` and `id`. What we can derive from these fields is that all fields should be lowercase. But that's all.

This specification defines the following rules for the naming of fields (and methods) in JSON objects.

- Names must be meaningful with defined semantics.
- Names must be snake-cased ascii strings (lower case, underscore).
- The first character must be a letter (`[a-z]`)
- Minimum length is 2 letters.
- Subsequent characters can be a letter or an underscore (`[a-z_]`).
- Words typically reserved in programming languages should be avoided (e.g. `if`, `delete`, `while`, ..). There is no definite list available, just make sure it follows common knowledge.
- Method names can also contain a `.` (dot) to categorize them (`[a-z_\.]`).

A regular expression to check the property names will look like this (just an excerpt of reserved words):

```
^a-z{2,}(?<!while|for|if|else)$
```

A regular expression to check the method names will look like this (just an excerpt of reserved words):

```
^[a-z][a-z_\.]{2,}(?<!while|for|if|else)$
```



### API versioning and consistency

The responses returned by the JSON RPC interface must follow a pre-defined set of rules to avoid having breaking changes on a new release. The standard JSON libraries allows us to deserialize whatever we want, but the rules to change the format must be defined.

It must be possible for an object to evolve by removing or adding additional fields, but depending on the impact different rules apply:

- When a field is added, it is per se **not** a breaking change. The client library either handles the new value or not. JSON deserializers normally won't break. Client libraries need to make sure that all unknown fields are handled properly or are ignored.
- When a field is removed, it **is** a breaking change. The client library might parse the values to trigger further logic.
- When a field is renamed, it is the same as when a field is removed. So it **is** a breaking change.
- When the logic of how a fields value is calculated changes, it **might** be a breaking change. If it's a bugfix, it's fine. If the value does not coherent to another value, it's fine too. Developers have to decide.
- When a field is added but other fields rely on the newly added field, it **is** a breaking change.

Objects should never vary in it's presentation. For example, given the dynamics of an operation, the representation an `Operation` object can vary. At the current state, properties are added and removed dynamically depending on the type of operation. This will be addressed by defining fields that can contain different types of sub-objects. These fields will always be present but may contain different values or a proper default value (objects = `null`, strings = `null`, integers = `null`, arrays = `[]`).



#### Versioning

There are a lot of ways available to version your API. The proposed way would be to implement an additional HTTP header that identifies the version of the API. This way the endpoint stays the same and there is no additional routing required to differentiate between versions.

The API versions do not necessarily need to correlate with the version of PascalCoin. While the PascalCoin Software can be in version 6, the API can still retain it's version 2.0.

This means that there will be parallel implementations of the API. This also means, that goals should be set with which major version (or block) an older API will be deactivated. 

The use of a `X-` prefixed HTTP-Headers is deprecated with https://tools.ietf.org/html/rfc6648, a suggestion with all the considerations mentioned in the RFC in mind would be: 

`PascalCoin-Api-Version: v2`

The current API will be version 1.0. If the header is not present, the API version refers to the old/current API implementation.

The versioning scheme follows https://semver.org/. Normally the client will just request the major version (v2, v3,..), but in case of changes in the API which are not breaking changes, the Node itself should be able to handle calls to minor versions (v2.1, v2.2) so the client library is able to use special minor versions. 



### Error handling

Errors must only be thrown in 2 cases:

- Invalid arguments (missing, wrong format)
- Internal errors while processing the request.

Methods to retrieve data must not throw an error with valid parameters but return null on `get_*` operations or an empty array with `list_*` operations. Error handling in client libraries is hard enough, catching possible exceptions and enumerating errors just because some data does not exist makes the implementation harder. 

**Examples:**

A call to a method that retrieves an account with an account number that does not exist yet must simply **return null**.

A call to a method that creates a transaction with an account that does not exist should **return an error**.



### Predefined Types

There are several properties which are clearly definable and should be re-used in the same manner on each and every method. 

#### Properties:

- **account_number** (base type = unsigned integer)
  An account number. It must not contain the checksum value.

  - Name/Prefix: `account` 
  - Validation: `^[0-9]?`

- **block_number** (base type = unsigned integer)
  The number of a block.

  - Name/Prefix: `block` 
  - Validation: `^[0-9]?`

- **op_hash** (base type = string)
  The identification of an operation.

  - Name/Prefix: `op_hash` 
  - Validation: `^[0-9A-F]{64}$` 

- **type** (base type = unsigned small integer)
  The type of an account. 

  - Name/Prefix: `type`
  - Validation: `^[0-65536]{1}$` 

- **name** (base type = string)
  The name of an account.

  - Name/Prefix: `name` 
  - Validation: 
    ``^[a-z!@#$%^&*()-+{}\\[\\]_:`|<>,\\.\\?\/~][a-z0-9!@#$%^&*()-+{}\\[\\]_:`\\|<>,\\.\\?\\/~]*$``

- **public_key** (base type = string)
  Either a hex encoded string containing the public key or the base 58 version of the public key. This is a rather drastic change but both strings are easily to differentiate on the server side and removes additional complexity from the implementation because currently all methods that accept a hex encoded key also accept the base58 version.

  If a response contains both (the base58 and the hex version), they can still be splitted by suffixing the field with `_b58` or `_hex`. 

  In the current API implementation the hex version is called `enc_pubkey`. While this is understandable, a Base58 key is also an encoded value.

  - Name/Prefix: `public_key` 
  - Validation Hex: `^[^A-F0-9]*([A-F0-9][^A-F0-9]*[A-F0-9][^A-F0-9]*)*$` 
  - Validation Base 58: `^[5KL][1-9A-HJ-NP-Za-km-z]$`  

- **ec_nid** (base type = unsigned small integer)
  An integer enumeration that can only contain the following values:

  - Name/Prefix:  `ec_nid`
  - Validation: `^(714|715|729|716)$`

- **currency** (base type = string)
  The currency value in molinas `[0-9]` as a string.

#### Objects

##### Connection

Holds data about a connection to a remote node.

**Properties**

 - `type` - string `server` if this connection is to a server node. `client` if this connection is a client node

 - `ip` - string The IP of remote node.

 - `port` - integer The Port used by the remote node.

 - `seconds_alive` - integer The number of the seconds the connection to the remote node is alive

 - `bytes_sent` - integer The number of bytes received from the remote node.

 - `bytes_received` - integer The number of bytes sent to the remote node.

 - `app_version` - string The application version of the remote node

 - `net_version` - integer The net protocol version of the remote node

 - `net_version_available` - integer The net protocol version available of the remote node

 - `time_difference` - integer The time difference in seconds of the remote node against the requested node.

**Example**

```json
{
  "type": "server",
  "ip": "188.166.87.36",
  "port": 4004,
  "seconds_alive": 232,
  "bytes_sent": 1311,
  "bytes_received": 1722,
  "app_version": "2.1.9lF",
  "net_version": 6,
  "net_version_available": 6,
  "time_difference": 0
}
```


##### Account

This object identifies an account with all it's data available.

- `account (account_number)` 
  The unique account number without its checksum.

- `public_key_hex (public_key_hex)` 

  Public key value in hex format of the owner.

- `balance (currency)`
  The balance of the account.

- `name (name)`
  The globally unique name of the account. 

- `type`
  The type of the account.  

- `number_of_operations` 

- `block_last_updated`

- `state` 

- `listing_info` 

  - price
  - account_seller
  - private_sale
  - public_key_buyer


#### Multi-Usage of fields

If a field type is used multiple times, it will be prefixed with the predefined name and suffixed by it's description (`field_description`). 

For example: `account_seller`, `account_signer`, `account_destination` and so on.

#### Prices

All prices (fee, transaction, rewards, ...) will be formatted in the smallest unit available (PASC * 10000 = molina). The prices need to be returned as a string, as they can exceed 32 bits. It is desribed as `currency` property type.

```json
{
  "price_wrong": 10000,
  "price_correct: "10000"
}
```

#### Paging

When results are truncated and/OR paged, the following fields are used to define the paging. 

- **[unsigned integer] offset [default = 0]**
  The offset parameter defines the start position of the truncated result set.
- **[unsigned integer] limit [default = *]**
  The limit parameter defines the number of items of the truncated result set. The default value can differ from implementation to implementation, but `0` always means that all results are returned. If `0` as a value is not available, the documentation should state it clearly.

### Method namespacing

To create a better overview of the JSON-RPC API itself, we will logically categorize all available methods and rename them so that the name of the category (namespace) will not be part of the actual name of the method anymore and methods like `multioperationaddoperation` have the chance to be renamed to a more human readable version. We will use a dot `.` to make to make the separation.

The resulting format is the namespace suffixed with the name of the method, divided by a `.` dot: `namespace.method`. 

When naming an operation, one must follow the following strategy:

- Whenever a method returns a single object the method will be prefixed with `get`. Together with the namespace-dot prefix the method name will be `namespace.get_*`.
- Whenever a method returns a list of objects the method will be prefixed with `list`. Together with the namespace-dot prefix the method name will be `namespace.list_*`.
- All methods expect a single parameter object which in itself contains multiple parameters and defines the signature of the method.

#### Namespace `node`

This namespace contains all methods related to the administration of the node that receives the requests.

##### addnode

This method will be renamed to `node.add_nodes` (plural) since it receives multiple node addresses. In addition to that, we alter the signature of the method by changing the now semicolon separated `nodes` parameter to an array of strings.

---

###### node.add_nodes

*Adds one or more nodes to the list of nodes and returns the number of nodes added.*

```
integer node.add_nodes(
  Array<string> $nodes
)
```

**Parameters**

 - `Array<string> $nodes` The list of nodes to add in the form of IP:port.

**Result**

The number of added nodes.

**Example Request**

```json
{
  "jsonrpc": "2.0",
  "method": "node.add_nodes",
  "params": {
    "nodes": [
      "1.1.1.1:4003",
      "192.168.0.88:4003"
    ]
  },
  "id": 1
}
```

**Example Response**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 1
}
```

**Example curl request**


```bash
curl -X POST http://localhost:4003 \
     -H "PascalCoin-Api-Version: v2" \
     -d @- << EOF
{
  "jsonrpc": "2.0",
  "method": "node.add_nodes",
  "params": {
    "nodes": [
      "1.1.1.1:4003",
      "192.168.0.88:4003"
    ]
  },
  "id": 1
} 
EOF
```
 

---


 
##### nodestatus

This method will be renamed to `node.status`.

---

*Gets the status of the node.*

```
NodeStatus? node.status()
```

---



##### getconnections

This method will be renamed to `node.list_connections`.

---

###### node.list_connections

*Gets the list of all connections of the requested node.*

```
array node.list_connections()
```

**Parameters**

 - No parameters.


**Result**

Information about a node.

**Example Request**

```json
{
  "jsonrpc": "2.0",
  "method": "node.list_connections",
  "params": {},
  "id": 1
}
```

**Example Response**

```json
{
  "id": 123,
  "jsonrpc": "2.0",
  "result": [
    {
      "type": "server",
      "ip": "188.166.87.36",
      "port": 4004,
      "seconds_alive": 232,
      "bytes_sent": 1311,
      "bytes_received": 1722,
      "app_version": "2.1.9lF",
      "net_version": 6,
      "net_version_available": 6,
      "time_difference": 0
    }
  ]
}
```

**Example curl request**


```bash
curl -X POST http://localhost:4003 \
     -H "PascalCoin-Api-Version: v2" \
     -d @- << EOF
{
  "jsonrpc": "2.0",
  "method": "node.list_connections",
  "params": {},
  "id": 1
} 
EOF
```
 

---

##### stopnode

This method will be renamed to `node.stop`.

---

*Tries to stop the current node and returns true on success.*

```
boolean node.stop()
```

---



##### startnode

This method will be renamed to `node.start`.

---

*Tries to start the current node and returns true on success*

```
boolean node.start()
```

---



#### Namespace `blocks`

This category contains all methods related to blocks. The following methods fall into this category:



##### getblock

This method will be renamed to `blocks.get`.

---

*Gets the block with the given block_number. If the block was not found, it will return null.*

```
Block? blocks.get(
    block_number $block
)
```

---



##### getblocks

This method will be split up. 

---

*Gets the blocks in the defined block number range. If there are no blocks in the given range, the method will return an empty array. If the range overlaps or exhaust the last mined block, the last block in the returned array will be the last mined block. If no blocks are found, the method will return an empty array.*

```
Array<Block> blocks.list(
    block_number $block_from,
    block_number $block_to
)
```

---

*Gets the last $count blocks starting from the last mined block.*

```
Array<Block> blocks.last(
    int $count
)
```

---



##### getblockcount

This method will be renamed to `blocks.count`.

---

*Gets the number of mined blocks. known by the node.*

```
int blocks.count()
```

---



##### getblockoperation

This method will be renamed to `blocks.get_operation_at`.

---

*Gets the Operation in the defined block at the defined position. If there is no operation at the given position or the block does not exist the method will return null.*

```
?Operation blocks.get_operation_at(
    block_number $block,
    int $position
)
```

---



##### getblockoperations

This method will be renamed to `blocks.list_operations`.

---

*Lists all operations of the given block. The results are sliced by the given start and max values. If the block has no operation, it will return an empty array*

```
Array<Operation> blocks.list_operations(
    block_number $block,
    int $offset = 0,
    int $limit = 100
)
```

---



#### Namespace `accounts`

This category contains all methods related to accounts (PASA). The following methods fall into this category:

##### getaccount

This method will be renamed to `accounts.get`.

---

*Gets the account with the specified account number. If no account was found, it will return null.*

```
?Account accounts.get(
    account_number $account
)
```

---



##### findaccounts

This method will be splitted into 3 methods.

 `accounts.get_by_name` and `account.list_by_type` and `accounts.list`. Since the name is unique, the `start` and `max` parameters don't make sense when searching for an account with a specified name.

---

*Gets a list of accounts starting at the given account_number and truncated to max accounts.*

```
Array<Account> account.list(
    int $offset,
    int $limit
)
```

---

*Gets a list of accounts with the given type starting the search at the given account_number and truncating the results to max accounts*

```
Array<Account> account.list_by_type(
    type $type,
    int $offset,
    int $limit
)
```

---

*Gets an account with the given name. If no account was found it will return null.*

```
?Account account.get_by_name(
    name $name
)
```

------



#### Namespace `wallet`

This category contains all methods related to the wallet managed by the node. 



##### getwalletaccounts

This method will be splitted.

---

*Gets the list of accounts in the wallet.*

```
Array<Account> wallet.list_accounts(
    int $offset,
    int $limit
)
```

---

*Lists the accounts of the given public key*

```
Array<Account> wallet.list_accounts_by_key(
    public_key $public_key,
    int $offset,
    int $limit
)
```

---



##### getwalletaccountscount

This method will be splitted.

---

*Gets the number of accounts known by the wallet.*

```
int wallet.count_accounts()
```

---

*Gets the number of accounts of the given public key.*

```
int wallet.count_accounts_by_public_key(
    public_key $public_key
)
```

---



##### getwalletpubkeys

This method will be renamed to `wallet.list_public_keys`.

---

*Gets a list of the known public keys.*

```
Array<PublicKey> wallet.list_public_keys(
    int $offset,
    int $limit
)
```

---



##### getwalletpublickey

This method will be renamed to `wallet.get_public_key`.

---

*Gets the Public Key object of the given encoded public key. If the PublicKey object was not found it will return null.*

```
?PublicKey wallet.get_public_key(
    public_key $public_key
)
```

---



##### setwalletpassword

This method will be renamed to `wallet.set_password`.

---

*Sets the password of the wallet.*

```
boolean wallet.set_password(
    string $password
)
```

---



##### getwalletcoins

This method will be splitted.

---

*Gets the balance of the complete wallet including all accounts and public keys*

```
currency wallet.get_balance()
```

---

*Gets the accumulated balance of all accounts of the given public key.*

```
currency wallet.get_balance_of_public_key(
    public_key $public_key
)
```

---



##### addnewkey

This method will be renamed to `wallet.add_private_key`.

---

*Adds a private key to the wallet and returns the resulting PublicKey object on success.*

```
PublicKey wallet.add_private_key(
   ec_nid $ec_nid,
   name $name
)
```



##### lock

This method will be renamed to `wallet.lock`.

---

*Locks the wallet.*

```
boolean wallet.lock()
```

---



##### unlock

This method will be renamed to `wallet.unlock`.

---

*Unlocks the wallet using the given password.*

```
boolean unlock(
    string $password
)
```

---



#### Namespace `operations` 

##### getpendings

This method will be renamed to `operations.list_pendings`.

---

*Gets the list of pending operations.*

```
Array<Operation> operations.list_pendings(
    int $offset,
    int $limit
)
```

---



##### findoperation

This method will be renamed to `operations.get`.

---

*Gets the operation with the given ophash. If the operation does not exist it will return null.*

```
?Operation operations.get(
    op_hash $op_hash
)
```

---



##### executeoperations

This method will be renamed to `operations.execute`.

---

*Executes the given signed operations.*

```
Array<Operation> operations.execute(
   ??? signed_operations
)
```



#### Namespace `offline`

This category contains all methods related to the offline signing operations.

##### operationsinfo

This method will be renamed to `offline.decode_operations`.

---

*Decodes the given raw signed operation and returns the decoded Operation objects.*

```
Array<Operation> offline.decode_operations(
   ??? signed_operations
)
```

---



##### singsendto

This method will be renamed to `offline.send_to`.

---

*Signs a transaction operation.*

```
??? offline.send_to(
    hex $signed_operations = '',
    int $last_n_operation,
    account_number $account_sender,
    public_key $public_key_sender,
    account_number $account_target,
    public_key $public_key_target,
    currency $amount,
    currency $fee,
    payload $payload,
    payload_method $payload_method,
    string $password
)
```

---



##### signchangekey

This method will be renamed to `offline.change_key`.

---

*Signs a change key operation. *

```
??? offline.change_key(
    hex $signed_operations = '',
    int $last_n_operation,
    account_number $account,
    public_key $old_public_key,
    public_key $new_public_key,
    currency $fee = currency(0),
    payload $payload = '',
    payload_method $payload_method = 'dest',
    string $password = null
)
```

---



##### signlistaccountforsale

This method will be renamed to `offline.list_account`.

------

*Signs a list account operation.*

```
??? offline.list_account(
    hex $signed_operations = '',
    int $last_n_operation,
    account_number $account_signer,
    public_key $public_key_signer,
    account_number $account_target,
    account_number $account_seller,
    currency $price,
    public_key $new_public_key,
    block_number $locked_until_block,
    currency $fee,
    payload $payload,
    payload_method $payload_method,
    string $password
)
```

------



##### signdelistaccountforsale

This method will be renamed to `offline.delist_account`.

------

*Signs a delist account operation.*

```
??? offline.delist_account(
    hex $signed_operations = '',
    int $last_n_operation
    public_key $public_key_signer,
)
```

------



##### signbuyaccount

This method will be renamed to `offline.buy_account`.

------

*Signs a buy account operation.*

```
??? offline.buy_account(
    hex $signed_operations = '',
    int $last_n_operation,
    account_number $account_buyer,
    public_key $public_key_signer,
    public_key $public_key_new,
    account_number $account_to_purchase,
    account_number $account_seller,
    currency $price,
    currency $amount,
    currency $fee,
    payload $payload,
    payload_method $payload_method,
    string $password
)
```

------



##### signchangeaccountinfo

This method will be renamed to `offline.change_account_info`.

------

*Signs a buy account operation.*

```
??? offline.change_account_info(
    hex $signed_operations = '',
    int $last_n_operation,
    account_number $account_signer,
    public_key $public_key_signer,
    public_key $public_key_new,
    account_number $account_to_purchase,
    account_number $account_seller,
    currency $price,
    currency $amount,
    currency $fee,
    payload $payload,
    payload_method $payload_method,
    string $password
)
```

------





 - `signsendto -> sign.send` 


- `signchangekey -> sign.change_key` 
- `signlistaccountforsale -> sign.list_for_sale` 
- `signbuyaccount -> sign.buy_account` 
- `signchangeaccountinfo -> sign.` 

**public_key**

- `encodepubkey -> public_key.encode` 
- `decodepubkey -> public_key.decode` 

## Objects

### Account

This object identifies an account with all it's data available.

- `account <account_number>` 
  The unique account number without its checksum.

- `public_key_hex` 

  Encoded public key value of the owner.

- `balance`
  The balance of the account.

- `name`
  The globally unique name of the account. 

- `type`
  The type of the account.  

- `number_of_operations` 

- `block_last_updated`

- `state` 

- `listing_info` 

  - price
  - account_seller
  - private_sale
  - public_key_buyer
  - ​



## Rationale

Discussion why was the specification was chosen over alternate designs. Evidence supporting the specification should be provided here, as well as community concerns and consensus.

## Backwards Compatibility

I suggest a parallel implementation with a goal set with which major version the old API will be deactivated. The simplest way is to implement a custom HTTP header which will define the version that the client wants to access. The use of a `X-` prefixed header is deprecated with https://tools.ietf.org/html/rfc6648, so a suggestion with all the considerations mentioned in the RFC in mind would be: 

`Api-Version: v2`

Either create a new entrypoint for all HTTP requests (localhost:4003/v2) or   

Any backwards incompatibilities should be described here, as well as work-arounds/solutions for these incompatibilities.

## Reference Implementation

The reference implementation must be provided before PIP is Completed.

## Links

References and links to relevant material