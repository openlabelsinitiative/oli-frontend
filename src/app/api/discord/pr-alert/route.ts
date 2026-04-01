import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.DISCORD_CONTRACTS;

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Discord webhook not configured' }, { status: 500 });
  }

  const { projectName } = await request.json();
  const projectLabel = projectName ? ` for **${projectName}**` : '';

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `Someone might open a new OSS-directory PR${projectLabel} from OLI website. [Check PRs here](https://github.com/opensource-observer/oss-directory/pulls)`,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to send Discord alert' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
