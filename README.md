# MapItOut - Interactive Mind Mapping Tool

A modern, keyboard-driven mind mapping application built with React and TypeScript. MapItOut enables rapid creation of hierarchical knowledge structures with smooth interactions and professional visual output.

## ✨ Current Features

### 🎯 Core Functionality
- **Hierarchical Node Creation**: Build tree-structured mind maps with unlimited depth
- **Keyboard-Driven Workflow**: Tab for children, Enter for siblings, rapid node creation
- **Automatic Camera Centering**: Camera follows your selected node for seamless workflow
- **Multiple Layout Engines**: Choose between different visual arrangements
- **Real-time Editing**: Inline text editing with keyboard shortcuts
- **Professional Export**: High-quality PNG export for presentations and documentation

### 🎨 Visual Design
- **Modern Dark Theme**: Professional slate color scheme
- **Tier-Based Colors**: Automatic color assignment based on node hierarchy
- **Smooth Animations**: 60fps interactions with CSS transforms
- **Responsive Design**: Adapts to any screen size
- **Clean Typography**: Optimized for readability and professional appearance

### 🖱️ Interaction Model
- **Middle Mouse Panning**: Natural canvas navigation (like tldraw, excalidraw)
- **Click to Select**: Intuitive node selection
- **Double-click to Edit**: Quick text modification
- **Keyboard Navigation**: Arrow keys to traverse between nodes
- **Automatic Centering**: Camera always follows your work

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Tab` | Create child node |
| `Enter` | Create sibling node |
| `Shift+Space` | Edit selected node |
| `Escape` | Clear selection |
| `Delete/Backspace` | Delete selected node |
| `Arrow Keys` | Navigate between nodes |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern web browser

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd mapitout

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Create Root Node**: Start with Tab to create your first node
2. **Build Hierarchy**: Use Tab for children, Enter for siblings
3. **Edit Content**: Double-click nodes or use Shift+Space
4. **Navigate**: Arrow keys to move between nodes
5. **Pan Canvas**: Middle mouse drag to move around
6. **Export**: Use the Export PNG button for high-quality output

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite
- **Layout Engine**: Custom hierarchical positioning algorithms

### Project Structure
```
src/
├── components/          # React components
│   ├── MapCanvas.tsx   # Main canvas component
│   ├── nodes/          # Node-related components
│   └── ui/             # UI components
├── stores/             # State management
│   ├── map-store.ts    # Mind map state
│   └── ui-store.ts     # UI state
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

### Key Components
- **MapCanvas**: Main rendering and interaction layer
- **NodeComponent**: Individual node rendering and editing
- **LayoutSwitcher**: Choose between different layout algorithms
- **useKeyboardNavigation**: Handles all keyboard interactions

## 🎯 Design Philosophy

MapItOut prioritizes **speed and simplicity** over complexity:

- **Keyboard-First**: Optimized for rapid creation workflows
- **Automatic Positioning**: Smart layout algorithms handle visual arrangement
- **Minimal UI**: Clean interface that doesn't get in the way
- **Professional Output**: Export-ready visuals for documentation
- **Responsive Performance**: Smooth 60fps interactions at any scale

## 🔮 Future Roadmap

### Phase 1: Core Mind Mapping Features
- [ ] **Node Styling**: Custom colors, fonts, and visual themes
- [ ] **Connection Lines**: Visual links between nodes with different styles
- [ ] **Node Icons**: Add icons and emojis to nodes
- [ ] **Text Formatting**: Bold, italic, and basic text styling
- [ ] **Node Shapes**: Different shapes (circles, diamonds, etc.)

### Phase 2: Advanced Layout & Organization
- [ ] **Multiple Layout Types**: Radial, hierarchical, flowchart, timeline
- [ ] **Manual Positioning**: Drag nodes to custom positions
- [ ] **Grouping**: Group related nodes together
- [ ] **Collapsible Branches**: Hide/show node subtrees
- [ ] **Auto-arrangement**: Smart layout optimization

### Phase 3: Collaboration & Sharing
- [ ] **Real-time Collaboration**: Multiple users editing simultaneously
- [ ] **Version History**: Track changes and revert to previous versions
- [ ] **Comments & Notes**: Add annotations to nodes
- [ ] **Sharing Links**: Public/private sharing of mind maps
- [ ] **Export Formats**: PDF, SVG, JSON, and more

### Phase 4: Advanced Features
- [ ] **Templates**: Pre-built mind map templates
- [ ] **Attachments**: Add files, images, and links to nodes
- [ ] **Search & Filter**: Find nodes and filter by content
- [ ] **Presentations**: Create slideshows from mind maps
- [ ] **Integration**: Connect with external tools and APIs

### Phase 5: Enterprise Features
- [ ] **User Management**: Authentication and user accounts
- [ ] **Team Workspaces**: Shared team environments
- [ ] **Advanced Permissions**: Role-based access control
- [ ] **Analytics**: Usage statistics and insights
- [ ] **API Access**: Programmatic access to mind maps

## 🛠️ Development

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits for version control

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern mind mapping tools like MindMeister and XMind
- Built with React, TypeScript, and Tailwind CSS
- Special thanks to the open source community

---

**MapItOut** - Transform your thoughts into structured knowledge maps.
