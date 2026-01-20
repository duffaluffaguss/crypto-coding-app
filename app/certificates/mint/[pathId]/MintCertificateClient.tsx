'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CertificatePreview, MintCertificateButton } from '@/components/certificates';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Trophy, BookOpen, Clock } from 'lucide-react';

interface PathInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  totalLessons: number;
  requiredLessons: number;
}

interface UserInfo {
  id: string;
  name: string;
  email?: string;
}

interface ProgressInfo {
  isEnrolled: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedLessons: number;
  completedRequired: number;
  isEligible: boolean;
}

interface MintCertificateClientProps {
  path: PathInfo;
  user: UserInfo;
  progress: ProgressInfo;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
} as const;

export function MintCertificateClient({ path, user, progress }: MintCertificateClientProps) {
  const canMint = progress.isEligible;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/paths/${path.slug}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Path
          </Button>
        </Link>
      </div>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            Mint Your Achievement
          </span>
        </div>
        
        <h1 className="text-3xl font-bold">
          {path.name} Certificate
        </h1>
        
        <p className="text-muted-foreground max-w-xl mx-auto">
          Mint your completion certificate as an NFT on Base. This soulbound token will 
          permanently verify your achievement on-chain.
        </p>
      </div>

      {/* Eligibility Check */}
      {!canMint && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
          <Lock className="h-4 w-4" />
          <AlertTitle>Not Eligible Yet</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              You need to complete all required lessons in this learning path before you can mint your certificate.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Progress: {progress.completedRequired} / {path.requiredLessons} required lessons</span>
            </div>
            <Link href={`/paths/${path.slug}`}>
              <Button variant="outline" size="sm" className="mt-2">
                Continue Learning
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {progress.isCompleted && (
        <Alert className="border-green-500/30 bg-green-500/5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600 dark:text-green-400">Path Completed!</AlertTitle>
          <AlertDescription>
            Congratulations! You completed this learning path
            {progress.completedAt && ` on ${new Date(progress.completedAt).toLocaleDateString()}`}.
            You're eligible to mint your certificate as an NFT.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Certificate Preview */}
        <div className="flex justify-center">
          <CertificatePreview 
            data={{
              courseName: path.name,
              userName: user.name,
              completionDate: progress.completedAt ? new Date(progress.completedAt) : new Date(),
              score: Math.round((progress.completedRequired / path.requiredLessons) * 100),
              pathId: path.id,
              difficulty: path.difficulty,
              lessonsCompleted: progress.completedLessons,
              totalLessons: path.totalLessons,
            }}
            size="lg"
            animated={canMint}
          />
        </div>

        {/* Mint Info & Button */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Certificate Details</CardTitle>
              <CardDescription>This information will be stored on-chain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Recipient</span>
                <span className="font-medium">{user.name}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Learning Path</span>
                <span className="font-medium">{path.name}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Difficulty</span>
                <Badge variant="outline" className={difficultyColors[path.difficulty]}>
                  {path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Lessons Completed</span>
                <span className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {progress.completedLessons} / {path.totalLessons}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  ~{path.estimatedHours} hours
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Network</span>
                <Badge variant="secondary" className="gap-1">
                  <BaseIcon className="w-3 h-3" />
                  Base
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* NFT Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Soulbound:</strong> Non-transferable, permanently tied to your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>On-chain:</strong> Verified on Base blockchain</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Free mint:</strong> Only pay gas fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Viewable:</strong> Display on OpenSea and other NFT platforms</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Mint Button */}
          <div className="pt-4">
            {canMint ? (
              <MintCertificateButton
                pathId={path.id}
                pathName={path.name}
                projectType="learning_path"
                score={Math.round((progress.completedRequired / path.requiredLessons) * 100)}
                className="w-full"
                onMintSuccess={(tokenId) => {
                  console.log('Minted token:', tokenId.toString());
                }}
              />
            ) : (
              <div className="text-center space-y-3">
                <Button disabled size="lg" className="w-full gap-2">
                  <Lock className="h-4 w-4" />
                  Complete Path to Mint
                </Button>
                <p className="text-xs text-muted-foreground">
                  Complete {path.requiredLessons - progress.completedRequired} more required lessons to unlock
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">What happens after minting?</p>
              <p className="text-sm text-muted-foreground">
                Your certificate NFT will be minted to your connected wallet. It will appear in your wallet 
                and on NFT marketplaces like OpenSea. You can share the link to prove your achievement. 
                The certificate is soulbound, meaning it cannot be transferred to other wallets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="currentColor"/>
    </svg>
  );
}

MintCertificateClient.displayName = 'MintCertificateClient';
