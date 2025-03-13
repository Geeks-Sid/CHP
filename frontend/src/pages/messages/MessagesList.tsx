
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusIcon, 
  SearchIcon, 
  MessageCircleIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  UserIcon, 
  SendIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

// Mock data for messages
const mockMessages = [
  { 
    id: '1', 
    with: 'Dr. Michael', 
    role: 'clinician',
    lastMessage: 'We need to restock Amoxicillin urgently.',
    timestamp: '10:30 AM',
    unread: true,
    messages: [
      { sender: 'Dr. Michael', content: 'Hello, do we have Amoxicillin in stock?', time: '10:15 AM' },
      { sender: 'Pharmacy', content: 'We only have 10 units left.', time: '10:20 AM' },
      { sender: 'Dr. Michael', content: 'We need to restock Amoxicillin urgently.', time: '10:30 AM' },
    ]
  },
  { 
    id: '2', 
    with: 'Sarah Receptionist', 
    role: 'receptionist',
    lastMessage: 'When will the new shipment arrive?',
    timestamp: 'Yesterday',
    unread: false,
    messages: [
      { sender: 'Sarah Receptionist', content: 'We have a patient asking about their prescription.', time: 'Yesterday' },
      { sender: 'Pharmacy', content: 'Which medication?', time: 'Yesterday' },
      { sender: 'Sarah Receptionist', content: 'When will the new shipment arrive?', time: 'Yesterday' },
    ]
  },
  { 
    id: '3', 
    with: 'Dr. Jessica', 
    role: 'clinician',
    lastMessage: 'Thanks for the update on the inventory.',
    timestamp: 'Sep 14',
    unread: false,
    messages: [
      { sender: 'Pharmacy', content: 'We\'ve updated the inventory as requested.', time: 'Sep 14' },
      { sender: 'Dr. Jessica', content: 'Thanks for the update on the inventory.', time: 'Sep 14' },
    ]
  },
];

const MessagesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredMessages = mockMessages.filter(
    (message) => message.with.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatData = mockMessages.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    toast({
      title: "Message sent",
      description: "Your message has been sent successfully.",
    });
    
    setNewMessage('');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Recent Messages</h2>
            </div>
            <div className="divide-y">
              {filteredMessages.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`p-4 hover:bg-muted/50 cursor-pointer ${selectedChat === chat.id ? 'bg-muted/50' : ''}`}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      chat.role === 'clinician' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      <UserIcon className={`h-5 w-5 ${
                        chat.role === 'clinician' ? 'text-green-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate">{chat.with}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {chat.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    {chat.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedChat ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedChatData?.role === 'clinician' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <UserIcon className={`h-5 w-5 ${
                      selectedChatData?.role === 'clinician' ? 'text-green-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedChatData?.with}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selectedChatData?.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4 flex flex-col space-y-4">
                {selectedChatData?.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.sender === 'Pharmacy' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] p-3 rounded-lg ${
                      message.sender === 'Pharmacy' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'Pharmacy' 
                          ? 'text-primary-foreground/80' 
                          : 'text-muted-foreground'
                      }`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Type your message..."
                    className="min-h-[60px]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    className="self-end" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center">
              <MessageCircleIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-medium mb-2">No conversation selected</h2>
              <p className="text-muted-foreground">Select a conversation from the list to view messages</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesList;
