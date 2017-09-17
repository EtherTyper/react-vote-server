const express = require('express');
const { Election, irv } = require('caritat');
const cors = require('cors');
const md5 = require('blueimp-md5');
const app = express();

app.set('port', (process.env.PORT || 5000));
app.use(cors())
const masterKey = 'd95408eb72112b35ac5e208fdc1309f3';

global.votes = process.env.PRODUCTION ? {} : {
    president: {
        some: [
            'JoeJ',
            'StevenX',
            'VaishnaviS'
        ],
        body: [
            'VaishnaviS',
            'JoeJ',
            'StevenX'
        ],
        once: [
            'StevenX',
            'JoeJ',
            'VaishnaviS'
        ],
        told: [
            'VaishnaviS',
            'JoeJ',
            'StevenX'
        ],
        me: [
            'JoeJ',
            'StevenX'
        ],
    }
};

global.locked = [];

app.get('/vote', function (req, res) {
    if (global.locked.includes(req.query.role)) {
        res.send(`${req.query.role} voting is locked.`);

        return;
    }

    global.votes = {
        ...global.votes,
        [req.query.role]: {
            ...global.votes[req.query.role],
            [req.query.voter]: req.query.list.split(',')
        }
    };

    res.send('Voting successful.');
});

app.delete('/vote', function (req, res) {
    delete global.votes[req.query.role][req.query.voter];
    res.send(global.votes[req.query.voter]);
});

app.get('/winner', function (req, res) {
    const votes = global.votes[req.query.role];
    const candidates = new Set();

    for (let voter in votes) {
        for (let candidate of votes[voter]) {
            candidates.add(candidate);
        }
    }

    if (candidates.size === 0) {
        res.send('No votes.');

        return;
    }

    let election = new Election({
        candidates: [...candidates]
    })

    for (let voter in votes) {
        election.addBallot(votes[voter]);
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

        res.send(`Locked ${req.query.role}`);
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

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
