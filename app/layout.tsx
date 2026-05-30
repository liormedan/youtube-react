import '../src/styles/_theme.scss';
import '../src/styles/_semantic-overrides.scss';
import 'semantic-ui-css/semantic.css';
import { Providers } from './Providers';
import { AppLayoutComponent } from '../src/components/AppLayout/AppLayout';

export const metadata = {
  title: 'medan-Tube',
  description: 'Youtube clone',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayoutComponent>
            {children}
          </AppLayoutComponent>
        </Providers>
      </body>
    </html>
  );
}
