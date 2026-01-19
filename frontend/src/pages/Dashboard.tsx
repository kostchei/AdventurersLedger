import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Adventurer's Ledger</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-white">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Adventurer'}!</h2>
          <p className="text-gray-400">Choose a campaign or create a new one to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-dashed border-gray-600 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="text-5xl mb-3">➕</div>
              <h3 className="text-xl font-semibold text-white mb-2">Create Campaign</h3>
              <p className="text-gray-400 text-sm">Start a new adventure</p>
            </div>
          </div>

          <div className="card hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Lost Mines of Phandelver</h3>
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">DM</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              A classic adventure for characters levels 1-5.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>👥 4 players</span>
              <span>📅 Session 8</span>
            </div>
          </div>

          <div className="card hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Curse of Strahd</h3>
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Player</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Gothic horror in the land of Barovia.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>👥 5 players</span>
              <span>📅 Session 12</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">Your Characters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">Thorin Oakenshield</h4>
                <span className="text-sm text-gray-400">Lvl 5</span>
              </div>
              <p className="text-gray-400 text-sm mb-2">Dwarf Fighter</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>⚔️ AC 18</span>
                <span>❤️ 45/45 HP</span>
              </div>
            </div>

            <div className="card border-2 border-dashed border-gray-600 flex items-center justify-center min-h-[140px] cursor-pointer hover:border-primary-500 transition-colors">
              <div className="text-center">
                <div className="text-3xl mb-2">➕</div>
                <p className="text-sm text-gray-400">Create Character</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
