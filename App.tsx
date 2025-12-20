import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, SpotLight } from '@react-three/drei';
import { Penguin3D } from './components/Penguin3D';
import { Stage } from './components/Stage';
import { ActionType, AnimationRequest, ChatMessage } from './types';
import { sendMessageToGemini } from './services/geminiService';

const App = () => {
  // --- State ---
  const [animationQueue, setAnimationQueue] = useState<AnimationRequest[]>([]);
  const [currentAction, setCurrentAction] = useState<ActionType>('IDLE');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Animation Loop ---
  useEffect(() => {
    if (currentAction === 'IDLE' && animationQueue.length > 0) {
      const nextAnim = animationQueue[0];
      setAnimationQueue((prev) => prev.slice(1));
      setCurrentAction(nextAnim.type);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        setCurrentAction('IDLE');
        timeoutRef.current = null;
      }, nextAnim.duration * 1000);
    }
  }, [currentAction, animationQueue]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // --- Handlers ---
  const addToQueue = (actions: string[]) => {
    const requests: AnimationRequest[] = actions.map(act => ({
      id: Math.random().toString(36).substring(7),
      type: act as ActionType,
      duration: 3.5 
    }));
    setAnimationQueue(prev => [...prev, ...requests]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: ChatMessage = { role: 'user', content: inputText };
    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const historyForApi = chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await sendMessageToGemini(historyForApi, userMsg.content);

      if (response.text) {
        setChatHistory(prev => [...prev, { role: 'model', content: response.text }]);
      }

      if (response.toolResult && response.toolResult.actions) {
         console.log("TOOL CALL RECEIVED:", response.toolResult.actions);
         addToQueue(response.toolResult.actions);
         setChatHistory(prev => [...prev, { 
             role: 'model', 
             content: `[Performing: ${response.toolResult.actions.join(', ')}]`,
             isToolCall: true 
         }]);
      }

    } catch (error) {
      console.error("API Error:", error);
      setChatHistory(prev => [...prev, { role: 'model', content: "Oops, I had a brain freeze (Error). Check console for details." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white font-sans overflow-hidden">
      
      {/* 3D Viewport */}
      <div className="flex-1 relative h-full">
        <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-purple-500 drop-shadow-lg filter blur-[0.5px]">
            Q-Penguin Live
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <div className={`w-3 h-3 rounded-full ${currentAction === 'IDLE' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
             <span className="text-sm font-mono opacity-80 text-amber-100">Action: {currentAction}</span>
          </div>
          {animationQueue.length > 0 && (
              <div className="mt-2 text-xs text-slate-400 font-mono">
                  Next: {animationQueue.map(a => a.type).join(' -> ')}
              </div>
          )}
        </div>

        <Canvas shadows camera={{ position: [0, 2, 8], fov: 40 }}>
          <color attach="background" args={['#050505']} />
          <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
          
          {/* --- Three Point Lighting Setup --- */}
          
          {/* 1. Ambient Light (Fill) - Ensures nothing is pitch black */}
          <ambientLight intensity={0.5} color="#404060" />

          {/* 2. Key Light - Main bright light source from front-right */}
          <spotLight 
            position={[5, 8, 5]} 
            angle={0.4} 
            penumbra={0.3} 
            intensity={1.5} 
            castShadow 
            color="#fff" 
            shadow-bias={-0.0001}
          />

          {/* 3. Rim Light - Strong back light to separate penguin from dark background */}
          <spotLight 
            position={[-5, 5, -5]} 
            angle={0.5} 
            penumbra={1} 
            intensity={4} 
            color="#3b82f6" 
          />
          
          {/* 4. Volumetric Stage Light - The "Beam" Effect */}
          <SpotLight
            distance={20}
            attenuation={5}
            anglePower={5} // Diffuse-ish
            position={[0, 8, 0]} 
            target-position={[0, 0, 0]}
            color="#fffae0" 
            opacity={0.3} // Visibility of the cone
            angle={0.3}
          />
          
          {/* Environment for reflections */}
          <Environment preset="city" blur={0.8} />

          {/* Content */}
          <group position={[0, -1, 0]}>
             <Stage />
             <Penguin3D currentAction={currentAction} animationProgress={0} />
             <ContactShadows opacity={0.7} scale={10} blur={2} far={4} resolution={256} color="#000000" />
          </group>
          
          <OrbitControls 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.1} 
            enableZoom={true} 
            enablePan={false}
            maxDistance={12}
            minDistance={4}
          />
        </Canvas>
      </div>

      {/* Sidebar */}
      <div className="w-96 flex flex-col border-l border-slate-700 bg-slate-900/90 backdrop-blur-md shadow-2xl">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {chatHistory.length === 0 && (
             <div className="text-center text-slate-500 mt-10">
                <p className="mb-2 text-amber-400 font-bold">✨ Showtime!</p>
                <p className="text-sm">Commands to try:</p>
                <ul className="text-xs mt-2 space-y-1 text-slate-400">
                    <li>"Fly around the stage!"</li>
                    <li>"Dazzle the audience."</li>
                    <li>"Slide into the spotlight."</li>
                </ul>
             </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div 
                key={idx} 
                className={`p-3 rounded-lg max-w-[90%] text-sm shadow-md ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 self-end text-white' 
                    : msg.isToolCall 
                        ? 'bg-slate-800 self-start text-amber-300 font-mono text-xs border border-amber-900/50' 
                        : 'bg-slate-800 self-start text-slate-200'
                }`}
            >
              {msg.content}
            </div>
          ))}
          {isProcessing && (
              <div className="self-start text-slate-400 text-xs animate-pulse">Thinking...</div>
          )}
        </div>

        <div className="p-2 border-t border-slate-700 grid grid-cols-4 gap-2">
            {['FLY', 'RUN_ACROSS', 'SLIDE', 'DAZZLE'].map(action => (
                <button 
                    key={action}
                    onClick={() => addToQueue([action])}
                    className="bg-slate-800 hover:bg-slate-700 text-[10px] text-amber-200 py-2 rounded transition-colors border border-slate-700"
                >
                    {action}
                </button>
            ))}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Command the penguin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isProcessing}
            />
            <button 
                onClick={handleSendMessage}
                disabled={isProcessing || !inputText}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 rounded font-semibold transition-transform active:scale-95"
            >
                Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
