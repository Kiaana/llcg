import { useState, useEffect } from 'react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTime, setSearchTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [searchMode, setSearchMode] = useState('fast');

  // 计时器
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setSearchTime(prev => prev + 0.1);
      }, 100);
      setTimerInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isLoading]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSearchTime(0);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: searchQuery,
          mode: searchMode 
        })
      });

      if (!response.ok) throw new Error('搜索失败');
      const data = await response.json();
      setSearchResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600">$1</strong>');
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-500 hover:text-blue-700 underline">$1</a>');
    return text;
  };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 md:py-16 max-w-5xl">
          {/* 标题部分 */}
          <div className="text-center mb-6 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 mb-2 sm:mb-4 tracking-tight">
              理论闯关助手
            </h1>
          </div>
  
          {/* 使用说明 */}
          <div className="max-w-3xl mx-auto px-2 sm:px-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">使用说明</h2>
              <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                请粘贴完整题目到搜索框，包括<strong>题型</strong>、<strong>题干</strong>、<strong>选项</strong>在内的所有信息。
              </p>
              <div className="flex flex-col space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-600">
                <p>🚀 快速模式：速度快，但答案有小概率和支撑文本不一致。</p>
                <p>🎯 精确模式：答案可保证与支撑文本一致，但速度慢，成本高。</p>
              </div>
              <p className="text-blue-500 mt-3 sm:mt-4 text-xs sm:text-sm">⚠️ 大多数情况下使用快速模式即可。</p>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
                声明：所有搜索以及答案生成均由大模型完成，可能会出现幻觉，仅供参考。综合正确率在90%以上。
              </p>
            </div>
          </div>
  
          {/* 搜索框部分 */}
          <div className="max-w-3xl mx-auto px-2 sm:px-4">
            <div className="flex flex-row justify-center mb-4 space-y-0 space-x-4">
              <button
                onClick={() => setSearchMode('fast')}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  searchMode === 'fast'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                🚀 快速模式
              </button>
              <button
                onClick={() => setSearchMode('accurate')}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  searchMode === 'accurate'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                🎯 精确模式
              </button>
            </div>
  
            <form onSubmit={handleSearch} className="relative">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="请粘贴完整的题目和选项..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg border rounded-xl sm:rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 min-h-[100px] sm:min-h-[120px] resize-y max-h-[200px] sm:max-h-[300px] overflow-auto"
              />
              <div className="flex flex-col sm:flex-row items-center justify-between mt-3 sm:mt-4 space-y-2 sm:space-y-0">
                <div className="text-blue-500 text-sm sm:text-base">
                  {searchTime > 0 && (
                    <span>用时: {searchTime.toFixed(1)}s</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>搜索中...</span>
                    </>
                  ) : (
                    <span>开始搜索</span>
                  )}
                </button>
              </div>
            </form>
          </div>
  
          {/* 搜索结果展示 */}
          <div className="mt-6 sm:mt-8 px-2 sm:px-4">
            {error && (
              <div className="max-w-3xl mx-auto p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm animate-fade-in text-sm sm:text-base">
                {error}
              </div>
            )}
  
            {searchResult && (
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 animate-fade-in">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-4">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {searchMode === 'fast' ? '🚀 快速模式' : '🎯 精确模式'} · {searchTime.toFixed(1)}s
                    </span>
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">答案</h3>
                    <p className="text-base sm:text-lg text-gray-700">{searchResult.answer}</p>
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">支持文本</h3>
                    <div 
                      className="prose prose-sm sm:prose-lg max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(searchResult.supporting_text) 
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">来源</h3>
                    <div 
                      className="prose prose-sm sm:prose-lg max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(searchResult.source) 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }