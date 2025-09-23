import { BaseTemplate } from '@/templates/BaseTemplate';
import { setRequestLocale } from 'next-intl/server';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      {/* <NavBar /> */}
      <BaseTemplate>
        <div>{props.children}</div>
      </BaseTemplate>
    </>
  );
}
