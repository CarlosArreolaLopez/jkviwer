import { ActiveViewport, DevicePreset, WorkspacePresetName } from '../types';

export const DEVICE_CATALOG: DevicePreset[] = [
  // Mobile
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'mobile',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'mobile',
    width: 393,
    height: 852,
    devicePixelRatio: 3,
  },
  {
    id: 'pixel-8',
    name: 'Google Pixel 8',
    category: 'mobile',
    width: 412,
    height: 915,
    devicePixelRatio: 2.6,
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Galaxy S24 Ultra',
    category: 'mobile',
    width: 430,
    height: 932,
    devicePixelRatio: 3,
  },

  // Tablet
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    category: 'tablet',
    width: 820,
    height: 1180,
    devicePixelRatio: 2,
  },
  {
    id: 'ipad-pro-12',
    name: 'iPad Pro 12.9"',
    category: 'tablet',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
  },

  // Laptop & Desktop
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13"',
    category: 'laptop',
    width: 1280,
    height: 800,
    devicePixelRatio: 2,
  },
  {
    id: 'laptop-hd',
    name: 'Laptop 1440p',
    category: 'laptop',
    width: 1440,
    height: 900,
    devicePixelRatio: 2,
  },
  {
    id: 'desktop-fhd',
    name: 'Desktop 1080p',
    category: 'desktop',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
  },
];

export const TAILWIND_BREAKPOINT_PRESETS: DevicePreset[] = [
  { id: 'tw-xs', name: 'Mobile Base (<sm)', category: 'mobile', width: 375, height: 740, devicePixelRatio: 2 },
  { id: 'tw-sm', name: 'Tailwind sm (640px)', category: 'mobile', width: 640, height: 800, devicePixelRatio: 2 },
  { id: 'tw-md', name: 'Tailwind md (768px)', category: 'tablet', width: 768, height: 900, devicePixelRatio: 2 },
  { id: 'tw-lg', name: 'Tailwind lg (1024px)', category: 'laptop', width: 1024, height: 800, devicePixelRatio: 2 },
  { id: 'tw-xl', name: 'Tailwind xl (1280px)', category: 'desktop', width: 1280, height: 850, devicePixelRatio: 1 },
  { id: 'tw-2xl', name: 'Tailwind 2xl (1536px)', category: 'desktop', width: 1536, height: 960, devicePixelRatio: 1 },
];

export function createActiveViewport(preset: DevicePreset, suffix?: string): ActiveViewport {
  const uniqueId = `vp-${preset.id}-${ suffix ?? Math.random().toString(36).substring(2, 7) }`;
  return {
    instanceId: uniqueId,
    presetId: preset.id,
    name: preset.name,
    category: preset.category,
    width: preset.width,
    height: preset.height,
    orientation: preset.width > preset.height ? 'landscape' : 'portrait',
    syncEnabled: true,
  };
}

export function getPresetSuite(suite: WorkspacePresetName): ActiveViewport[] {
  switch (suite) {
    case 'essential': {
      const ids = ['iphone-15-pro', 'ipad-air', 'macbook-air-13'];
      return DEVICE_CATALOG.filter((d) => ids.includes(d.id)).map((d, idx) =>
        createActiveViewport(d, `init-${idx}`)
      );
    }
    case 'mobile-suite': {
      return DEVICE_CATALOG.filter((d) => d.category === 'mobile').map((d, idx) =>
        createActiveViewport(d, `mob-${idx}`)
      );
    }
    case 'tailwind-breakpoints': {
      return TAILWIND_BREAKPOINT_PRESETS.map((d, idx) =>
        createActiveViewport(d, `tw-${idx}`)
      );
    }
    case 'all': {
      return DEVICE_CATALOG.slice(0, 6).map((d, idx) =>
        createActiveViewport(d, `all-${idx}`)
      );
    }
  }
}
