'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var express = require('express');

var _require = require('caritat'),
    Election = _require.Election,
    irv = _require.irv;

var cors = require('cors');
var md5 = require('blueimp-md5');
var app = express();

app.set('port', process.env.PORT || 5000);
app.use(cors());
var masterKey = 'd95408eb72112b35ac5e208fdc1309f3';

global.votes = process.env.PRODUCTION ? {} : {
    president: {
        some: ['JoeJ', 'StevenX', 'VaishnaviS'],
        body: ['VaishnaviS', 'JoeJ', 'StevenX'],
        once: ['StevenX', 'JoeJ', 'VaishnaviS'],
        told: ['VaishnaviS', 'JoeJ', 'StevenX'],
        me: ['JoeJ', 'StevenX']
    }
};

global.locked = [];

app.get('/vote', function (req, res) {
    if (global.locked.includes(req.query.role)) {
        res.send(req.query.role + ' voting is locked.');

        return;
    }

    global.votes = _extends({}, global.votes, _defineProperty({}, req.query.role, _extends({}, global.votes[req.query.role], _defineProperty({}, req.query.voter, req.query.list.split(',')))));

    res.send('Voting successful.');
});

app.delete('/vote', function (req, res) {
    delete global.votes[req.query.role][req.query.voter];
    res.send(global.votes[req.query.voter]);
});

app.get('/winner', function (req, res) {
    var votes = global.votes[req.query.role];
    var candidates = new Set();

    for (var voter in votes) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = votes[voter][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var candidate = _step.value;

                candidates.add(candidate);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    if (candidates.size === 0) {
        res.send('No votes.');

        return;
    }

    var election = new Election({
        candidates: [].concat(_toConsumableArray(candidates))
    });

    for (var _voter in votes) {
        election.addBallot(votes[_voter]);
    }

    res.send(irv(election));
});

app.get('/locked', function (req, res) {
    res.send(global.locked.includes(req.query.role).toString());
});

app.get('/lock', function (req, res) {
    if (md5(req.query.password) !== masterKey) {
        res.status(401).end();
    } else {
        global.locked.push(req.query.role);

        res.send('Locked ' + req.query.role);
    }
});

app.get('/reset', function (req, res) {
    if (md5(req.query.password) !== masterKey) {
        res.status(401).end();
    } else {
        global.votes = {};
        global.locked = [];

        res.send('Reset successful.');
    }
});

// Debugging/spam-prevention method.
app.get('/illuminacho_portal', function (req, res) {
    if (md5(req.query.password) !== masterKey) {
        res.status(404).end();
    } else {
        console.log(global.votes);
        res.send('Welcome to the illuminacho.');
    }
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});