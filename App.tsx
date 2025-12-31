import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, SpotLight } from '@react-three/drei';
import { Penguin3D } from './components/Penguin3D';
import { Stage } from './components/Stage';
import { SettingsModal } from './components/SettingsModal';
import { BTVisualizer } from './components/BTVisualizer';
import { ActionType, ChatMessage, LLMSettings, ExpressionType } from './types';
import { ACTION_DURATIONS } from './constants';
import { createPenguinBT, Blackboard } from './services/bt';

const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: 'http://localhost:11434/v1',
  modelName: 'llama3'
};

// --- BT Controller Component ---
// This handles the tree ticking within the R3F loop
const BehaviorController = ({ 
  bt, 
  blackboard,
  setCurrentAction,
  setCurrentExpression,
  setPenguinPosition,
  penguinPosition,
  setChatHistory,
  chatHistory,
  llmSettings
}: any) => {
  
  // Inject transient data into blackboard
  useEffect(() => {
    blackboard.set('chatHistory', chatHistory);
    blackboard.set('llmSettings', llmSettings);
    // 实时同步当前位置到黑板，供 ReturnToOriginAction 使用
    blackboard.set('penguinPosition', penguinPosition);
  }, [chatHistory, llmSettings, penguinPosition, blackboard]);

  useFrame((state) => {
    // 3D 投影映射：将 2D 鼠标坐标转换为 3D 舞台坐标
    if (blackboard.get('isDragging')) {
        const factorX = state.camera.position.z * 0.6;
        const factorY = state.camera.position.z * 0.4;
        
        blackboard.set('pointerPosition', { 
            x: state.pointer.x * factorX, 
            y: state.pointer.y * factorY + 1.5, 
            z: 0 
        });
    }
    
    // Tick the tree
    bt.tick(null, blackboard);

    // --- BT Driver: Sync Blackboard outputs to React state ---
    
    // 1. Handle Action Output (Body Animation)
    const nextAction = blackboard.get('bt_output_action');
    if (nextAction) {
      setCurrentAction(nextAction);
      blackboard.set('bt_output_action', null); // Consume
    }

    // 2. Handle Expression Output (Facial Expression)
    const nextExpression = blackboard.get('bt_output_expression');
    if (nextExpression) {
      setCurrentExpression(nextExpression);
      blackboard.set('bt_output_expression', null); // Consume
    }

    // 3. Handle Position Output
    const nextPos = blackboard.get('bt_output_position');
    if (nextPos) {
      setPenguinPosition(nextPos);
      blackboard.set('bt_output_position', null); // Consume
    }

    // 4. Handle Chat Output
    const nextMsg = blackboard.get('bt_output_chat_msg');
    if (nextMsg) {
      setChatHistory((prev: any) => [...prev, nextMsg]);
      blackboard.set('bt_output_chat_msg', null); // Consume
    }
  });

  return null;
};

const App = () => {
  // --- State ---
  const [currentAction, setCurrentAction] = useState<ActionType>('IDLE');
  const [currentExpression, setCurrentExpression] = useState<ExpressionType>('NEUTRAL');
  const [penguinPosition, setPenguinPosition] = useState<[number, number, number]>([0, -1, 0]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [llmSettings, setLlmSettings] = useState<LLMSettings>(() => {
    const saved = localStorage.getItem('penguin_llm_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // --- Behavior Tree ---
  const bt = useMemo(() => createPenguinBT(), []);
  const blackboard = useMemo(() => new Blackboard(), []);
  
  // --- Handlers ---
  const saveSettings = (newSettings: LLMSettings) => {
    setLlmSettings(newSettings);
    localStorage.setItem('penguin_llm_settings', JSON.stringify(newSettings));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: ChatMessage = { role: 'user', content: inputText };
    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    
    // Update Blackboard to trigger BT Branch
    blackboard.set('lastUserInput', userMsg.content);
    blackboard.set('hasNewInput', true);
    setIsProcessing(true);
    
    // UI heuristic to reset processing state
    setTimeout(() => setIsProcessing(false), 2000); 
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white font-sans overflow-hidden">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={llmSettings}
        onSave={saveSettings}
      />

      {/* 3D Viewport */}
      <div className="flex-1 relative h-full">
        <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-purple-500 drop-shadow-lg filter blur-[0.5px]">
            Q-Penguin BT
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <div className={`w-3 h-3 rounded-full ${currentAction === 'IDLE' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
             <span className="text-sm font-mono opacity-80 text-amber-100">Action: {currentAction}</span>
          </div>
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-800/50 hover:bg-slate-700 backdrop-blur rounded-full transition-all text-slate-300 hover:text-white"
          title="Configure Model"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>

        <Canvas 
          shadows 
          camera={{ position: [0, 2, 8], fov: 40 }}
          onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单，以便用于拖拽
          // 全局捕获鼠标抬起事件，防止拖拽过程中鼠标移出企鹅身体导致无法松开
          onPointerUp={(e) => {
              if (e.button === 2) {
                  blackboard.set('isDragging', false);
              }
          }}
        >
          <color attach="background" args={['#050505']} />
          <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
          
          <ambientLight intensity={0.5} color="#404060" />
          <SpotLight distance={20} attenuation={5} anglePower={5} position={[0, 8, 0]} target-position={[0, 0, 0]} color="#fffae0" opacity={0.3} angle={0.3} />
          
          <Suspense fallback={null}>
            <Environment preset="city" blur={0.8} />
            <BehaviorController 
                bt={bt} 
                blackboard={blackboard} 
                setCurrentAction={setCurrentAction}
                setCurrentExpression={setCurrentExpression}
                setPenguinPosition={setPenguinPosition}
                penguinPosition={penguinPosition}
                setChatHistory={setChatHistory}
                chatHistory={chatHistory}
                llmSettings={llmSettings}
            />
            <group position={[0, -1, 0]}>
               <Stage />
               <Penguin3D 
                  currentAction={currentAction} 
                  currentExpression={currentExpression}
                  position={penguinPosition}
                  onPointerDown={(e) => {
                      // 0: 左键, 1: 中键, 2: 右键
                      if (e.button === 2) {
                          blackboard.set('isDragging', true);
                      }
                  }}
                  onPointerUp={(e) => {
                      // 保留这里的逻辑以防万一，但主要依赖 Canvas 的全局监听
                      if (e.button === 2) {
                          blackboard.set('isDragging', false);
                      }
                  }}
                  onClick={(e) => {
                      // 左键点击触发互动
                      if (e.button === 0) {
                          blackboard.set('isClicked', true);
                          setTimeout(() => blackboard.set('isClicked', false), 500);
                      }
                  }}
               />
               <ContactShadows opacity={0.7} scale={10} blur={2} far={4} resolution={256} color="#000000" />
            </group>
          </Suspense>
          
          <OrbitControls 
            enablePan={false}
            maxDistance={12}
            minDistance={4}
            // 修正后的鼠标按键绑定：
            // 0: 左键 (ROTATE), 1: 中键/滚轮 (ZOOM), 2: 右键 (PAN - 我们将其禁用)
            mouseButtons={{
                LEFT: 0,   // Rotate
                MIDDLE: 1, // Zoom (Dolly)
                RIGHT: -1  // None
            }}
          />
        </Canvas>
      </div>

      {/* Sidebar */}
      <div className="w-96 flex flex-col border-l border-slate-700 bg-slate-900/90 backdrop-blur-md shadow-2xl">
        {/* BT Visualizer Section */}
        <div className="h-1/2 border-b border-slate-700 flex flex-col overflow-hidden">
           <BTVisualizer tree={bt} blackboard={blackboard} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {chatHistory.length === 0 && (
             <div className="text-center text-slate-500 mt-10">
                <p className="mb-2 text-amber-400 font-bold">🐧 BT Powered Avatar</p>
                <p className="text-xs mb-4">Try dragging me or clicking me!</p>
                <ul className="text-xs mt-2 space-y-1 text-slate-400">
                    <li>"Fly around the stage!"</li>
                    <li>"Dazzle the audience."</li>
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
              <div className="self-start text-slate-400 text-xs animate-pulse">BT Thinking...</div>
          )}
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
