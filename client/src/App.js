import React, { useState, useEffect } from 'react';
import {
  Chat,
  Channel,
  Thread,
  Window,
  ChannelList,
  ChannelListTeam,
  MessageList,
  MessageTeam,
  MessageInput,
  ChannelHeader,
} from 'stream-chat-react';
import rug from 'random-username-generator';
import { StreamChat } from 'stream-chat';
import axios from 'axios';

import 'stream-chat-react/dist/css/index.css';

let chatClient;

function App() {
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const username = rug.generate();
    async function getToken() {
      try {
        const response = await axios.post('http://localhost:5500/join', {
          username,
        });
        const { token } = response.data;
        const apiKey = response.data.api_key;

        chatClient = new StreamChat(apiKey);

        const user = await chatClient.setUser(
          {
            id: username,
            name: username,
          },
          token
        );

        const channel = chatClient.channel('team', 'gen2');
        await channel.watch();
        setChannel(channel);

        channel.on('message.new', async event => {
          if (user.me.id !== event.user.id) {
            try {
              const response = await axios.post(
                'http://localhost:5500/speech',
                {
                  text: event.message.text,
                }
              );

              const audioStream = response.data.AudioStream.data;
              var uInt8Array = new Uint8Array(audioStream);
              var arrayBuffer = uInt8Array.buffer;
              var blob = new Blob([arrayBuffer]);
              var url = URL.createObjectURL(blob);

              const audio = new Audio(url);
              audio.play();
            } catch (err) {
              console.log(err);
            }
          }
        });
      } catch (err) {
        console.log(err);
      }
    }

    getToken();
  }, []);

  if (channel) {
    return (
      <Chat client={chatClient} theme="team light">
        <ChannelList
          options={{
            subscribe: true,
            state: true,
          }}
          List={ChannelListTeam}
        />
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList Message={MessageTeam} />
            <MessageInput focus />
          </Window>
          <Thread Message={MessageTeam} />
        </Channel>
      </Chat>
    );
  }

  return <div>Loading...</div>;
}

export default App;
