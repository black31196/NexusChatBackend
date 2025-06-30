const chatSvc = require('../services/chatService');
exports.handleWebhook = async (req, res) => {
  const body = req.bodyJson;  // parsed in the previous middleware
  const io   = req.app.get('io');

  await Promise.all(
    body.events.map(async (event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        const from    = event.source.userId;                     // LINE user
        const content = event.message.text;
        const to      = process.env.DEFAULT_AGENT_ID;

        // 1) save in your chat DB
        const saved  = await chatSvc.sendMessage({ from, to, content });

        // 2) now broadcast to the agent’s socket room
        const outgoing = {
          id:             saved._id.toString(),
          conversationId: from,            // opens the convo with the LINE user
          from_user:           saved.from_user, // LINE user id
          to_user:             saved.to_user,   // your agent’s id
          content:        saved.content,
          timestamp:      saved.timestamp.toISOString(),
          status:         'delivered'
        };
        console.log('[LINE webhook] emitting receive_message →', outgoing);
        io.to(to).emit('receive_message', outgoing);

        // 3) (optional) reply over LINE
        // await lineClient.replyMessage(event.replyToken, {
        //   type: 'text', text: 'Thanks, got your message!'
        // });
      }
    })
  );

  // 200 OK to LINE
  res.sendStatus(200);
};