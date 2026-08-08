import { useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { hexToOklch, hexToOklchLight } from '@/lib/theme';

type OrganizationSettingsResponse = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export function useDynamicTheme(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const organizationId = useAuthStore((state) => state.user?.organizationId ?? null);

  useEffect(() => {
    if (!isAuthenticated || organizationId === null || organizationId === undefined) {
      const existingStyle = document.getElementById('dynamic-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    let isMounted = true;

    const removeDynamicStyle = (): void => {
      const existingStyle = document.getElementById('dynamic-theme');
      if (existingStyle) {
        existingStyle.remove();
      }
    };

    const applyDynamicTheme = (data: OrganizationSettingsResponse): void => {
      const primaryColor = data.primaryColor?.trim();
      const secondaryColor = data.secondaryColor?.trim();

      const cssParts: string[] = [];

      if (primaryColor) {
        const primaryRoot = hexToOklch(primaryColor);
        const primaryDark = hexToOklchLight(primaryColor);

        cssParts.push(`
          :root {
            --primary: ${primaryRoot};
            --ring: ${primaryRoot};
            --chart-1: ${primaryRoot};
            --sidebar-primary: ${primaryRoot};
            --sidebar-ring: ${primaryRoot};
          }
          .dark {
            --primary: ${primaryDark};
            --ring: ${primaryDark};
            --chart-1: ${primaryDark};
            --sidebar-primary: ${primaryDark};
            --sidebar-ring: ${primaryDark};
          }
        `);
      }

      if (secondaryColor) {
        const secondaryRoot = hexToOklch(secondaryColor);
        const secondaryDark = hexToOklchLight(secondaryColor);

        cssParts.push(`
          :root {
            --secondary: ${secondaryRoot};
            --chart-2: ${secondaryRoot};
          }
          .dark {
            --secondary: ${secondaryDark};
            --chart-2: ${secondaryDark};
          }
        `);
      }

      const css = cssParts.join('\n');

      if (!css) {
        removeDynamicStyle();
        return;
      }

      const existingStyle = document.getElementById('dynamic-theme') as HTMLStyleElement | null;

      if (existingStyle) {
        existingStyle.textContent = css;
        return;
      }

      const style = document.createElement('style');
      style.id = 'dynamic-theme';
      style.textContent = css;
      document.head.appendChild(style);
    };

    const loadTheme = async (): Promise<void> => {
      try {
        const response = await axios.get<OrganizationSettingsResponse>('/settings/organization');

        if (!isMounted) {
          return;
        }

        applyDynamicTheme(response.data ?? {});
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Failed to load dynamic theme settings:', error);
        removeDynamicStyle();
      }
    };

    void loadTheme();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, organizationId]);
}
