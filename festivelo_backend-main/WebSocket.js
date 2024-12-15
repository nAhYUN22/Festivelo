const WebSocket = require('ws');
const mongoose = require('mongoose');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Set(); // 모든 클라이언트 관리
        
        this.wss.on('connection', (ws) => {
            console.log('새로운 클라이언트 연결됨');
            this.clients.add(ws);
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(data, ws);
                } catch (error) {
                    console.error('메시지 처리 중 오류:', error);
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('클라이언트 연결 해제됨');
            });
        });
        
        this.setupChangeStream();
    }
    
    handleMessage(data, ws) {
        // 메시지 타입에 따른 처리
        switch (data.type) {
            case 'update':
            case 'delete':
            case 'addPlace':
            case 'removePlace':
            case 'create':
                // 다른 모든 클라이언트에게 변경사항 브로드캐스트
                this.broadcast(data, ws);
                break;
        }
    }

    broadcast(data, sender) {
        this.clients.forEach(client => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    setupChangeStream() {
        const pipeline = [
            {
                $match: {
                    'operationType': { $in: ['update', 'insert', 'delete'] }
                }
            }
        ];
        
        const changeStream = mongoose.model('Trip').watch(pipeline, {
            fullDocument: 'updateLookup'
        });
        
        changeStream.on('change', (change) => {
            const message = {
                type: change.operationType,
                documentId: change.documentKey._id.toString(),
                data: change.fullDocument
            };
            
            // 모든 클라이언트에게 변경사항 전송
            this.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        });
    }
}

module.exports = WebSocketServer;