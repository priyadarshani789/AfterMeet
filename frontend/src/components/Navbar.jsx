import React from 'react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-40 flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">AM</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AfterMeet</h1>
          <p className="text-xs text-gray-500">Meeting Intelligence Platform</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600">👤</span>
          <span className="text-sm text-gray-700">User</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
