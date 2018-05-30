This is my test:

*Adds one or more nodes to the list of nodes and returns the number of nodes added.*

```
integer node.add_nodes(
  Array<string> $nodes,
  account_number $account
)
```

**Parameters**

 - `Array<string> $nodes` The list of nodes to add in the form of IP:port.
 - `account_number $account` undefined

**Result**

The number of added nodes.

**Example Request**

```
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

```
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 1
}
```

*Adds one or more nodes to the list of nodes and returns the number of nodes added.*

```
integer node.add_nodes(
  Array<string> $nodes,
  account_number $account
)
```

**Parameters**

 - `Array<string> $nodes` The list of nodes to add in the form of IP:port.
 - `account_number $account` undefined

**Result**

The number of added nodes.

**Example Request**

```
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

```
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 1
}
```
