const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Qs = require('qs');
const tcb = require('@cloudbase/node-sdk');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 设置跨域
app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    res.header('X-Powered-By', '3.2.1');
    res.header('Content-type', 'application/json;charset=utf-8');
    next();
});

const DBapp = tcb.init({});
const pageDate = DBapp.database().collection("page_date_db");
const mockDate = DBapp.database().collection("mock_date_db");
const preScriptData = DBapp.database().collection("prescript_date_db");

app.get('/', (req, res) => {
    res.status(200)
    res.json({a:'222'})
});

app.get('/getList', (req, res) => {
    pageDate.get().then(e => {
        res.status(200)
        res.json({
            code: 0,
            data: {
                records: e.data
            }
        })
    });
});

app.get('/getListMock', (req, res) => {
    mockDate.get().then(e => {
        res.status(200)
        res.json({
            code: 0,
            data: {
                records: e.data
            }
        })
    });
});

app.get('/getMeta', (req, res) => {
    pageDate
    .where({
        metaID: req.query.metaID
    })
    .get().then(e => {
        res.status(200)
        res.json({
            code: 0,
            data: e.data[0]
        })
    });
});

app.get(/^\/mock/, (req, res) => {
    var requestedUrlSTR = req.protocol + '://' + req.get('Host') + req.url;
    var requestedUrl = new URL(requestedUrlSTR);
    mockDate
    .where({
        pathname: requestedUrl.pathname.replace('mock/', '')
    })
    .get().then(e => {
        if (e.data[0].type !== 'get') {
            res.status(200)
            res.json({
                code: 1,
                msg: 'type error'
            })
        }
        try {
            /* eslint-disable */
            var resFunc = new Function('return ' + e.data[0].responsebody).call(this);
            /* eslint-enable */
            var resVal = resFunc.call(this, JSON.parse(e.data[0].requestparams));
            res.status(200)
            res.json(resVal)
        } catch (e) {
            res.status(200)
            res.json({
                code: 1,
                err: e,
                responsebodyStr: e.data[0].responsebody
            })
        }
    });
});

app.post(/^\/mock/, (req, res) => {
    var requestedUrlSTR = req.protocol + '://' + req.get('Host') + req.url;
    var requestedUrl = new URL(requestedUrlSTR);
    mockDate
    .where({
        pathname: requestedUrl.pathname.replace('mock/', '')
    })
    .get().then(e => {
        if (e.data[0].type !== 'post') {
            res.status(200)
            res.json({
                code: 1,
                msg: 'type error'
            })
        }
        try {
            /* eslint-disable */
            var resFunc = new Function('return ' + e.data[0].responsebody).call(this);
            /* eslint-enable */
            var resVal = resFunc.call(this, JSON.parse(e.data[0].requestparams));
            res.status(200)
            res.json(resVal)
        } catch (e) {
            res.status(200)
            res.json({
                code: 1,
                err: e,
                responsebodyStr: e.data[0].responsebody
            })
        }
    });
});

app.post('/saveMock', function (req, res) {
    var body = JSON.parse(Qs.parse(req.body).mockData);
    mockDate.add(body).then(e => {
        if (e.id) {
            res.status(200)
            res.json({
                code: 0,
                body: body
            });
        }
    })
});

app.post('/updateMock', function (req, res) {
    var body = JSON.parse(Qs.parse(req.body).mockData);
    var pathname = body.pathname;
    mockDate
    .where({ pathname: pathname })
    .options({ multiple: false })
    .update({
        requestparams: body.requestparams,
        responsebody: body.responsebody,
        type: body.type
    })
    .then(e => {
        if (e.updated) {
            res.status(200)
            res.json({
                code: 0,
                msg: 'success'
            }); 
        } else {
            res.status(200)
            res.json({
                code: 1,
                msg: 'fail'
            });
        }
    })
});

app.post('/saveMeta', function (req, res) {
    var body = JSON.parse(Qs.parse(req.body).pageData);
    pageDate.add(body).then(e => {
        if (e.id) {
            res.status(200)
            res.json({
                code: 0,
                msg: 'success'
            });
        } else {
            res.status(200)
            res.json({
                code: 1,
                msg: 'fail'
            });
        }
    })
});

app.post('/updatePreScript', function (req, res) {
    var body = JSON.parse(Qs.parse(req.body).preScript);
    var id = body.id;
    preScriptData
    .where({ id: id })
    .options({ multiple: false })
    .update({
        useScript: body.useScript,
        scriptList: body.scriptList,
        styleList: body.styleList,
        script: body.script
    })
    .then(e => {
        if (e.updated) {
            res.status(200)
            res.json({
                code: 0,
                msg: 'success'
            }); 
        } else {
            res.status(200)
            res.json({
                code: 1,
                msg: 'fail'
            });
        }
    })
});

app.get('/getPreScript', (req, res) => {
    preScriptData.get().then(e => {
        res.status(200)
        res.json({
            code: 0,
            data: {
                script: e.data[0]
            }
        })
    });
});

const port = process.env.PORT || 80;

app.listen(port, () => {
    console.log('Hello world listening on port now!!', port);
});
