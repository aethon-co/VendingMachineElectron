interface SetupScreenProps {
    secretTokenInput: string;
    setSecretTokenInput: (val: string) => void;
    handleSetup: () => void;
}

export default function SetupScreen({ secretTokenInput, setSecretTokenInput, handleSetup }: SetupScreenProps) {
    return (
        <div className='bg-transparent w-[600px] h-[1024px] m-0 p-0 flex flex-col justify-center items-center text-gray-900 overflow-hidden font-["Outfit"] px-12'>
            <div className="w-full max-w-[440px] flex flex-col gap-10">
                <div className="flex flex-col gap-3 text-center">
                    <div className="w-20 h-20 bg-white shadow-sm rounded-3xl border border-black/5 flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl text-blue-600">🛠️</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
                        Initial <span className="text-blue-600">Setup.</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        Enter the secret token provided by your administrator to link this machine.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="relative group">
                        <input
                            type="text"
                            value={secretTokenInput}
                            onChange={(e) => setSecretTokenInput(e.target.value)}
                            placeholder="Enter Secret Token"
                            className="w-full bg-white rounded-[24px] px-8 py-6 text-gray-900 text-lg font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm border border-black/5 transition-all group-hover:border-blue-500/20"
                        />
                    </div>

                    <button
                        onClick={handleSetup}
                        disabled={!secretTokenInput}
                        className="w-full h-[76px] bg-blue-600 text-white font-black text-xl rounded-[24px] flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-20 disabled:shadow-none"
                    >
                        <span>Initialize Machine</span>
                        <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm text-blue-600 font-black shadow-sm">→</span>

                    </button>
                </div>

                <p className="text-center text-gray-300 text-xs font-bold uppercase tracking-[0.2em]">
                    Machine ID: VEND-PRO-8000
                </p>
            </div>
        </div>
    );
}


