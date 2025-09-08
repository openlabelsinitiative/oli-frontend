'use client';

import { Twitter, MessageCircle, Globe, ExternalLink } from 'lucide-react';

interface AuthorSocialLinksProps {
  authorSocial?: {
    twitter?: string;
    discord?: string;
    farcaster?: string;
    telegram?: string;
    website?: string;
  };
}

export default function AuthorSocialLinks({ authorSocial }: AuthorSocialLinksProps) {
  if (!authorSocial || Object.keys(authorSocial).length === 0) {
    return null;
  }

  const socialLinks = [
    {
      key: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      url: authorSocial.twitter,
      color: 'hover:text-blue-500 hover:bg-blue-50',
      baseColor: 'text-gray-600'
    },
    {
      key: 'discord',
      label: 'Discord',
      icon: MessageCircle,
      url: authorSocial.discord,
      color: 'hover:text-indigo-500 hover:bg-indigo-50',
      baseColor: 'text-gray-600'
    },
    {
      key: 'farcaster',
      label: 'Farcaster',
      icon: MessageCircle,
      url: authorSocial.farcaster,
      color: 'hover:text-purple-500 hover:bg-purple-50',
      baseColor: 'text-gray-600'
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: MessageCircle,
      url: authorSocial.telegram,
      color: 'hover:text-blue-400 hover:bg-blue-50',
      baseColor: 'text-gray-600'
    },
    {
      key: 'website',
      label: 'Website',
      icon: Globe,
      url: authorSocial.website,
      color: 'hover:text-green-500 hover:bg-green-50',
      baseColor: 'text-gray-600'
    }
  ].filter(link => link.url);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 font-medium">Follow:</span>
      <div className="flex items-center gap-1">
        {socialLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.key}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 ${link.baseColor} ${link.color} rounded-lg transition-all duration-200 group`}
              title={`${link.label} - ${link.url}`}
            >
              <Icon className="w-4 h-4" />
              <ExternalLink className="w-3 h-3 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
