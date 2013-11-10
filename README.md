exctrl
======

**NOTE:** Readme is not completed...

Flexible controllers for express.js apps.

## Installation

```bash
npm install exctrl
```

## Usage

```javascript
var express = require('express'),
    app = express(),
    exctrl = require('exctrl');
    
// configuring express app...

exctrl.load(app, {pattern: __dirname + '/controllers/*.js'});

// Done...
```
