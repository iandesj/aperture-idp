import fs from 'fs';
import path from 'path';
import { hiddenStore } from '../store';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('HiddenStore', () => {
  const mockPersistencePath = path.join(process.cwd(), '.aperture', 'hidden.json');

  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(false);
  });

  describe('hideComponent', () => {
    it('should hide a component', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue();

      hiddenStore.hideComponent('test-component');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockPersistencePath,
        expect.stringContaining('"test-component"'),
        'utf-8'
      );
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue();

      hiddenStore.hideComponent('test-component');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(mockPersistencePath),
        { recursive: true }
      );
    });
  });

  describe('unhideComponent', () => {
    it('should unhide a component', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const initialData = JSON.stringify({ hiddenComponents: ['test-component', 'another-component'] });
      mockFs.readFileSync.mockReturnValue(initialData);
      mockFs.writeFileSync.mockReturnValue();

      hiddenStore.hideComponent('test-component');
      hiddenStore.hideComponent('another-component');
      hiddenStore.unhideComponent('test-component');

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      const unhideCalls = mockFs.writeFileSync.mock.calls.filter((call) => {
        const data = JSON.parse(call[1] as string);
        return !data.hiddenComponents.includes('test-component') && 
               data.hiddenComponents.includes('another-component');
      });
      expect(unhideCalls.length).toBeGreaterThan(0);
    });
  });

  describe('isHidden', () => {
    it('should return true for hidden component', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ hiddenComponents: ['test-component'] })
      );

      const result = hiddenStore.isHidden('test-component');

      expect(result).toBe(true);
    });

    it('should return false for non-hidden component', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ hiddenComponents: ['other-component'] })
      );

      const result = hiddenStore.isHidden('test-component');

      expect(result).toBe(false);
    });

    it('should return false when no hidden components file exists', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = hiddenStore.isHidden('test-component');

      expect(result).toBe(false);
    });
  });

  describe('getHiddenComponents', () => {
    it('should return all hidden components', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ hiddenComponents: ['comp-1', 'comp-2', 'comp-3'] })
      );

      const result = hiddenStore.getHiddenComponents();

      expect(result).toHaveLength(3);
      expect(result).toContain('comp-1');
      expect(result).toContain('comp-2');
      expect(result).toContain('comp-3');
    });

    it('should return empty array when no components are hidden', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ hiddenComponents: [] })
      );

      const result = hiddenStore.getHiddenComponents();

      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all hidden components', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ hiddenComponents: ['comp-1', 'comp-2'] })
      );
      mockFs.writeFileSync.mockReturnValue();

      hiddenStore.clear();

      const lastCall = mockFs.writeFileSync.mock.calls[mockFs.writeFileSync.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1] as string);
      expect(savedData.hiddenComponents).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return stats about hidden components', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ hiddenComponents: ['comp-1', 'comp-2'] })
      );

      const stats = hiddenStore.getStats();

      expect(stats.total).toBe(2);
      expect(stats.components).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle read errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = hiddenStore.isHidden('test-component');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load hidden components from disk:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle write errors gracefully', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      hiddenStore.hideComponent('test-component');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save hidden components to disk:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});

