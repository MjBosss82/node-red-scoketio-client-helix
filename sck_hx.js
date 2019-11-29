module.exports = function(RED) {
    function GestNoti(_Node,_Tipo,_Mess,_Dett)
    {
        if (_Node !== undefined){
            switch(_Tipo){
                case 1:
                _Node.status({ fill: 'green', shape: 'dot', text: _Mess });
                break;
                case 2:
                _Node.status({ fill: 'red', shape: 'ring', text: _Mess });
                break;
                case 3:
                _Node.status({ fill: 'yellow', shape: 'ring', text: _Mess });
                break;
            }
            if (_Dett !== undefined){
                _Node.send({ payload: _Mess + " - " + _Dett });
            }
        }
    };
    function JsonTest(_dati){
        return (Object.prototype.toString.call(_dati).toLowerCase() === "[object object]") ? true : false ;
    }
    function JsonConvert(_dati){
        if(JsonTest(_dati) === false){
            if (/^[\],:{}\s]*$/.test(_dati.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                return _dati = JSON.parse(_dati);
            }
        }else{
            return _dati;
        }
        return {};
    }

    function SckConn(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        try{
            var VarFlow = this.context().flow;
            node.on('close', function (done) {
                try{
                    ObjSck.disconnect();
                    node.status({});
                    done();
                }catch(ex){ GestNoti(node,2,"Errore",ex); }
            });

            var _Uri = config.protocollo + config.host + ":" + config.port;
            var ObjSck = require('socket.io-client')(_Uri);

            ObjSck.on('connect', function() {
                GestNoti(node,1,"Connesso");
                node.send({ payload: "Connesso" });
            });

            ObjSck.on('disconnect', function () {
                GestNoti(node,3,"Disconnesso");
            });

            ObjSck.on('connect_error', function(err) {
                if (err) {
                    GestNoti(node,2,"Errore",err);
                }else{
                    GestNoti(node,2,"Errore");
                }
            });
            ObjSck.on('connect_timeout', function() {
                GestNoti(node,2,"TimeOut");
            });
            VarFlow.set('SckConn',ObjSck);
        }catch(ex){ GestNoti(node,2,"Errore",ex); }
    };
    RED.nodes.registerType('hx-sck-avvio', SckConn);
    /**************************************************************
    **** ********
    ***************************************************************/
    function SckEmit(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        try{
            var VarFlow = this.context().flow;
            var ObjSck = VarFlow.get('SckConn');
            GestNoti(node,3,"InAttesa");
            node.on('input', function (msg) {
                try{
                    GestNoti(node,1,"Attivo");
                    if(ObjSck !== undefined){
                        const _DataInput = msg.payload;
                        const _DataInputState = JsonTest(_DataInput);
                        var _Invia,_Start = false;

                        if(_DataInputState === false && _DataInput === "Connesso" && config.data_send !== ""){
                            _Start = true;
                            _Invia = JsonConvert(config.data_send);
                        }else if(_DataInputState === true){
                            _Start = true;
                            _Invia = JsonConvert(_DataInput);
                        }
                        if(_Start === true){
                            ObjSck.emit(config.nome, _Invia);
                            GestNoti(node,1,"Eseguito");
                        }
                    }else{
                        GestNoti(node,2,"Errore","SocketServer non connesso!");
                    }
                }catch(ex){ GestNoti(node,2,"Errore",ex);}
            });
        }catch(ex){ GestNoti(node,2,"Errore",ex);}
    }
    RED.nodes.registerType("hx-sck-emit",SckEmit);
    /**************************************************************
    **** ********
    ***************************************************************/
    function SckAscolto(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        try{
            var VarFlow = this.context().flow;
            var ObjSck = VarFlow.get('SckConn');
            GestNoti(node,3,"InAttesa");
            node.on('input', function (msg) {
                try{
                    const data = msg.payload;
                    if(data === "Connesso" && ObjSck !== undefined && config.data_send !== ""){
                        ObjSck.on(config.nome, function (data) {
                            GestNoti(node,1,"Scatenato");
                            node.send({ payload: data });
                        })
                    }
                }catch(ex){ GestNoti(node,2,"Errore",ex);}
            });
        }catch(ex){ GestNoti(node,2,"Errore",ex);}
    }
    RED.nodes.registerType("hx-sck-ascolto",SckAscolto);
}
