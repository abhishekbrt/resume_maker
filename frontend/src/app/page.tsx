import { HomeContent } from '@/components/home/home-content';

type SearchParams = Record<string, string | string[] | undefined>;

interface HomePageProps {
  searchParams?: SearchParams | Promise<SearchParams>;
}

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const showAuthRequiredPrompt = getSingleParam(resolvedParams.auth) === 'required';

  return <HomeContent showAuthRequiredPrompt={showAuthRequiredPrompt} />;
}
