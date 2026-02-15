import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserSound, 
  ShieldCheck, 
  Trash, 
  Plus, 
  CheckCircle, 
  XCircle,
  User,
  Clock,
  ChartLine,
  Fingerprint
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  type VoiceProfile,
  type BiometricSettings,
  defaultBiometricSettings
} from '@/lib/voice-biometrics'
import { VoiceBiometricEnrollment } from './VoiceBiometricEnrollment'
import { BiometricSettingsComponent } from './BiometricSettings'
import { formatDate } from '@/lib/utils'

export function VoiceBiometricManager() {
  const [profiles, setProfiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [settings, setSettings] = useKV<BiometricSettings>('biometric-settings', defaultBiometricSettings)
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'profiles' | 'settings'>('profiles')

  const handleEnrollmentComplete = (profile: VoiceProfile) => {
    setProfiles((current) => [...(current || []), profile])
    
    toast.success('Voice profile created', {
      description: `Profile for ${profile.userName} has been saved`
    })
  }

  const handleDeleteProfile = (profileId: string) => {
    setProfiles((current) => (current || []).filter(p => p.id !== profileId))
    
    toast.success('Voice profile deleted', {
      description: 'The voice biometric profile has been removed'
    })
  }

  const currentProfile = (profiles || []).find(p => p.userId === selectedProfile?.userId)
  const successRate = currentProfile 
    ? currentProfile.totalVerifications > 0
      ? (currentProfile.successfulVerifications / currentProfile.totalVerifications) * 100
      : 0
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint size={28} weight="duotone" className="text-primary" />
            Voice Biometric Security
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage voice profiles and biometric authentication settings
          </p>
        </div>
        
        <Button onClick={() => setShowEnrollment(true)} size="lg">
          <Plus size={20} className="mr-2" weight="bold" />
          Enroll New Profile
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profiles' | 'settings')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <UserSound size={18} weight="duotone" />
            Voice Profiles ({(profiles || []).length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <ShieldCheck size={18} weight="duotone" />
            Security Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4 mt-6">
          {(profiles || []).length === 0 ? (
            <Alert>
              <UserSound size={20} />
              <AlertDescription>
                No voice profiles enrolled. Click "Enroll New Profile" to create your first voice biometric profile.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(profiles || []).map((profile) => (
                <Card key={profile.id} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/20 rounded-lg">
                          <User size={24} weight="duotone" className="text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{profile.userName}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            User ID: {profile.userId}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={profile.isVerified ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {profile.isVerified ? (
                          <><CheckCircle size={14} className="mr-1" /> Verified</>
                        ) : (
                          <><XCircle size={14} className="mr-1" /> Unverified</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Security Level</p>
                        <Badge 
                          variant={
                            profile.securityLevel === 'high' ? 'default' :
                            profile.securityLevel === 'medium' ? 'secondary' :
                            'outline'
                          }
                        >
                          {profile.securityLevel.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Profile Quality</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={profile.voicePrint.quality * 100} 
                            className="h-2 flex-1"
                          />
                          <span className="text-xs font-mono">
                            {Math.round(profile.voicePrint.quality * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Enrollment Samples</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={profile.enrollmentProgress} 
                          className="h-2 flex-1"
                        />
                        <span className="text-xs font-mono">
                          {profile.voicePrint.enrollmentSamples} samples
                        </span>
                      </div>
                    </div>

                    {profile.totalVerifications > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Verification Statistics</span>
                          <ChartLine size={14} weight="duotone" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold">{profile.totalVerifications}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-success">{profile.successfulVerifications}</p>
                            <p className="text-xs text-muted-foreground">Success</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-destructive">{profile.failedVerifications}</p>
                            <p className="text-xs text-muted-foreground">Failed</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Success Rate</span>
                            <span className="font-mono">
                              {Math.round((profile.successfulVerifications / profile.totalVerifications) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(profile.successfulVerifications / profile.totalVerifications) * 100}
                            className="h-1"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Clock size={14} weight="duotone" />
                      <span>Created {formatDate(profile.createdAt)}</span>
                    </div>

                    {profile.lastVerificationAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle size={14} weight="duotone" />
                        <span>Last verified {formatDate(profile.lastVerificationAt)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProfile(profile)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProfile(profile.id)}
                      >
                        <Trash size={16} weight="bold" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {settings && (
            <BiometricSettingsComponent
              settings={settings}
              onChange={setSettings}
            />
          )}
        </TabsContent>
      </Tabs>

      <VoiceBiometricEnrollment
        isOpen={showEnrollment}
        onClose={() => setShowEnrollment(false)}
        onComplete={handleEnrollmentComplete}
        settings={settings || defaultBiometricSettings}
      />
    </div>
  )
}
