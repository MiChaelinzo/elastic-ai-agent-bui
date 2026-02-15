export interface VoiceProfile {
  id: string
  userId: string
  userName: string
  createdAt: number
  updatedAt: number
  isVerified: boolean
  enrollmentComplete: boolean
  enrollmentProgress: number
  voicePrint: VoicePrint
  securityLevel: 'low' | 'medium' | 'high'
  accessPermissions: string[]
  totalVerifications: number
  successfulVerifications: number
  failedVerifications: number
  lastVerificationAt?: number
}

export interface VoicePrint {
  features: VoiceFeatures[]
  averageFeatures: VoiceFeatures
  enrollmentSamples: number
  quality: number
}

export interface VoiceFeatures {
  mfcc: number[]
  pitch: number
  energy: number
  zeroCrossing: number
  spectralCentroid: number
  spectralRolloff: number
  tempo: number
  formants: number[]
  jitter: number
  shimmer: number
}

export interface BiometricVerificationResult {
  verified: boolean
  confidence: number
  userId?: string
  userName?: string
  matchScore: number
  threshold: number
  securityLevel: 'low' | 'medium' | 'high'
  timestamp: number
  features: VoiceFeatures
  reason?: string
}

export interface BiometricEnrollmentSession {
  sessionId: string
  userId: string
  startedAt: number
  samples: VoiceFeatures[]
  requiredSamples: number
  progress: number
  phrases: string[]
  currentPhraseIndex: number
  isComplete: boolean
}

export interface BiometricSettings {
  enabled: boolean
  securityLevel: 'low' | 'medium' | 'high'
  verificationThreshold: number
  enrollmentSamples: number
  continuousVerification: boolean
  adaptiveLearning: boolean
  antiSpoofing: boolean
  livenessDetection: boolean
  requirePassphrase: boolean
  sessionTimeout: number
}

export const defaultBiometricSettings: BiometricSettings = {
  enabled: true,
  securityLevel: 'medium',
  verificationThreshold: 0.75,
  enrollmentSamples: 5,
  continuousVerification: true,
  adaptiveLearning: true,
  antiSpoofing: true,
  livenessDetection: true,
  requirePassphrase: false,
  sessionTimeout: 3600000
}

export const securityLevelThresholds: Record<'low' | 'medium' | 'high', number> = {
  low: 0.65,
  medium: 0.75,
  high: 0.85
}

export const enrollmentPhrases = [
  "My voice is my password",
  "I authorize this action with my voice",
  "Elastic agent orchestrator verify my identity",
  "Voice biometrics authentication enabled",
  "This is my unique voice signature"
]

export function extractVoiceFeatures(audioData: Float32Array, sampleRate: number = 44100): VoiceFeatures {
  const mfcc = calculateMFCC(audioData, sampleRate)
  const pitch = calculatePitch(audioData, sampleRate)
  const energy = calculateEnergy(audioData)
  const zeroCrossing = calculateZeroCrossingRate(audioData)
  const spectralCentroid = calculateSpectralCentroid(audioData, sampleRate)
  const spectralRolloff = calculateSpectralRolloff(audioData, sampleRate)
  const tempo = calculateTempo(audioData, sampleRate)
  const formants = calculateFormants(audioData, sampleRate)
  const jitter = calculateJitter(audioData, sampleRate)
  const shimmer = calculateShimmer(audioData)

  return {
    mfcc,
    pitch,
    energy,
    zeroCrossing,
    spectralCentroid,
    spectralRolloff,
    tempo,
    formants,
    jitter,
    shimmer
  }
}

function calculateMFCC(audioData: Float32Array, sampleRate: number, numCoefficients: number = 13): number[] {
  const fftSize = 512
  const numFilters = 26
  const mfcc: number[] = []

  const magnitude = calculateMagnitudeSpectrum(audioData, fftSize)
  const melFilters = createMelFilterBank(numFilters, fftSize, sampleRate)
  
  const filterBankEnergies = melFilters.map(filter => {
    let energy = 0
    for (let i = 0; i < filter.length && i < magnitude.length; i++) {
      energy += magnitude[i] * filter[i]
    }
    return Math.log(Math.max(energy, 1e-10))
  })

  for (let i = 0; i < numCoefficients; i++) {
    let coefficient = 0
    for (let j = 0; j < filterBankEnergies.length; j++) {
      coefficient += filterBankEnergies[j] * Math.cos(i * (j + 0.5) * Math.PI / filterBankEnergies.length)
    }
    mfcc.push(coefficient)
  }

  return mfcc
}

function calculateMagnitudeSpectrum(audioData: Float32Array, fftSize: number): number[] {
  const padded = new Float32Array(fftSize)
  const len = Math.min(audioData.length, fftSize)
  for (let i = 0; i < len; i++) {
    padded[i] = audioData[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (len - 1)))
  }

  const real = Array.from(padded)
  const imag = new Array(fftSize).fill(0)
  
  fft(real, imag)

  const magnitude: number[] = []
  for (let i = 0; i < fftSize / 2; i++) {
    magnitude.push(Math.sqrt(real[i] * real[i] + imag[i] * imag[i]))
  }

  return magnitude
}

function fft(real: number[], imag: number[]) {
  const n = real.length
  if (n <= 1) return

  const halfN = n / 2
  const evenReal = new Array(halfN)
  const evenImag = new Array(halfN)
  const oddReal = new Array(halfN)
  const oddImag = new Array(halfN)

  for (let i = 0; i < halfN; i++) {
    evenReal[i] = real[i * 2]
    evenImag[i] = imag[i * 2]
    oddReal[i] = real[i * 2 + 1]
    oddImag[i] = imag[i * 2 + 1]
  }

  fft(evenReal, evenImag)
  fft(oddReal, oddImag)

  for (let k = 0; k < halfN; k++) {
    const angle = -2 * Math.PI * k / n
    const cosAngle = Math.cos(angle)
    const sinAngle = Math.sin(angle)

    const tReal = oddReal[k] * cosAngle - oddImag[k] * sinAngle
    const tImag = oddReal[k] * sinAngle + oddImag[k] * cosAngle

    real[k] = evenReal[k] + tReal
    imag[k] = evenImag[k] + tImag
    real[k + halfN] = evenReal[k] - tReal
    imag[k + halfN] = evenImag[k] - tImag
  }
}

function createMelFilterBank(numFilters: number, fftSize: number, sampleRate: number): number[][] {
  const minFreq = 0
  const maxFreq = sampleRate / 2

  const melMin = frequencyToMel(minFreq)
  const melMax = frequencyToMel(maxFreq)

  const melPoints: number[] = []
  for (let i = 0; i <= numFilters + 1; i++) {
    melPoints.push(melMin + (melMax - melMin) * i / (numFilters + 1))
  }

  const freqPoints = melPoints.map(mel => melToFrequency(mel))
  const binPoints = freqPoints.map(freq => Math.floor((fftSize + 1) * freq / sampleRate))

  const filters: number[][] = []
  for (let i = 1; i <= numFilters; i++) {
    const filter: number[] = new Array(fftSize / 2).fill(0)
    
    for (let j = binPoints[i - 1]; j < binPoints[i]; j++) {
      filter[j] = (j - binPoints[i - 1]) / (binPoints[i] - binPoints[i - 1])
    }
    
    for (let j = binPoints[i]; j < binPoints[i + 1]; j++) {
      filter[j] = (binPoints[i + 1] - j) / (binPoints[i + 1] - binPoints[i])
    }
    
    filters.push(filter)
  }

  return filters
}

function frequencyToMel(frequency: number): number {
  return 2595 * Math.log10(1 + frequency / 700)
}

function melToFrequency(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1)
}

function calculatePitch(audioData: Float32Array, sampleRate: number): number {
  const autocorrelation: number[] = []
  const minLag = Math.floor(sampleRate / 400)
  const maxLag = Math.floor(sampleRate / 50)

  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < audioData.length - lag; i++) {
      sum += audioData[i] * audioData[i + lag]
    }
    autocorrelation.push(sum)
  }

  let maxCorrelation = -Infinity
  let bestLag = minLag

  for (let i = 0; i < autocorrelation.length; i++) {
    if (autocorrelation[i] > maxCorrelation) {
      maxCorrelation = autocorrelation[i]
      bestLag = i + minLag
    }
  }

  return sampleRate / bestLag
}

function calculateEnergy(audioData: Float32Array): number {
  let energy = 0
  for (let i = 0; i < audioData.length; i++) {
    energy += audioData[i] * audioData[i]
  }
  return energy / audioData.length
}

function calculateZeroCrossingRate(audioData: Float32Array): number {
  let crossings = 0
  for (let i = 1; i < audioData.length; i++) {
    if ((audioData[i] >= 0 && audioData[i - 1] < 0) || 
        (audioData[i] < 0 && audioData[i - 1] >= 0)) {
      crossings++
    }
  }
  return crossings / (audioData.length - 1)
}

function calculateSpectralCentroid(audioData: Float32Array, sampleRate: number): number {
  const magnitude = calculateMagnitudeSpectrum(audioData, 512)
  
  let weightedSum = 0
  let magnitudeSum = 0
  
  for (let i = 0; i < magnitude.length; i++) {
    const freq = i * sampleRate / (2 * magnitude.length)
    weightedSum += freq * magnitude[i]
    magnitudeSum += magnitude[i]
  }
  
  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
}

function calculateSpectralRolloff(audioData: Float32Array, sampleRate: number, threshold: number = 0.85): number {
  const magnitude = calculateMagnitudeSpectrum(audioData, 512)
  
  let totalEnergy = 0
  for (let i = 0; i < magnitude.length; i++) {
    totalEnergy += magnitude[i]
  }
  
  let cumulativeEnergy = 0
  const targetEnergy = totalEnergy * threshold
  
  for (let i = 0; i < magnitude.length; i++) {
    cumulativeEnergy += magnitude[i]
    if (cumulativeEnergy >= targetEnergy) {
      return i * sampleRate / (2 * magnitude.length)
    }
  }
  
  return sampleRate / 2
}

function calculateTempo(audioData: Float32Array, sampleRate: number): number {
  const hopSize = 512
  const energyEnvelope: number[] = []
  
  for (let i = 0; i < audioData.length; i += hopSize) {
    let energy = 0
    for (let j = 0; j < hopSize && i + j < audioData.length; j++) {
      energy += audioData[i + j] * audioData[i + j]
    }
    energyEnvelope.push(Math.sqrt(energy / hopSize))
  }
  
  const autocorr: number[] = []
  const minBPM = 60
  const maxBPM = 200
  const minLag = Math.floor((60 / maxBPM) * sampleRate / hopSize)
  const maxLagValue = Math.floor((60 / minBPM) * sampleRate / hopSize)
  
  for (let lag = minLag; lag < maxLagValue && lag < energyEnvelope.length / 2; lag++) {
    let sum = 0
    for (let i = 0; i < energyEnvelope.length - lag; i++) {
      sum += energyEnvelope[i] * energyEnvelope[i + lag]
    }
    autocorr.push(sum)
  }
  
  let maxCorr = -Infinity
  let bestLag = minLag
  
  for (let i = 0; i < autocorr.length; i++) {
    if (autocorr[i] > maxCorr) {
      maxCorr = autocorr[i]
      bestLag = i + minLag
    }
  }
  
  return 60 * sampleRate / (bestLag * hopSize)
}

function calculateFormants(audioData: Float32Array, sampleRate: number, numFormants: number = 5): number[] {
  const lpcOrder = 12
  const lpcCoeffs = calculateLPC(audioData, lpcOrder)
  
  const roots = findLPCRoots(lpcCoeffs)
  
  const formants = roots
    .filter(root => root.imag > 0)
    .map(root => {
      const angle = Math.atan2(root.imag, root.real)
      return (angle * sampleRate) / (2 * Math.PI)
    })
    .filter(freq => freq > 0 && freq < sampleRate / 2)
    .sort((a, b) => a - b)
    .slice(0, numFormants)
  
  while (formants.length < numFormants) {
    formants.push(0)
  }
  
  return formants
}

function calculateLPC(audioData: Float32Array, order: number): number[] {
  const autocorr: number[] = []
  
  for (let lag = 0; lag <= order; lag++) {
    let sum = 0
    for (let i = 0; i < audioData.length - lag; i++) {
      sum += audioData[i] * audioData[i + lag]
    }
    autocorr.push(sum)
  }
  
  const lpc = new Array(order + 1).fill(0)
  const err = new Array(order + 1).fill(0)
  
  err[0] = autocorr[0]
  
  for (let i = 1; i <= order; i++) {
    let lambda = 0
    for (let j = 1; j < i; j++) {
      lambda -= lpc[j] * autocorr[i - j]
    }
    lambda -= autocorr[i]
    lambda /= err[i - 1]
    
    lpc[i] = lambda
    
    for (let j = 1; j < i; j++) {
      lpc[j] += lambda * lpc[i - j]
    }
    
    err[i] = err[i - 1] * (1 - lambda * lambda)
  }
  
  return lpc
}

function findLPCRoots(coeffs: number[]): Array<{real: number, imag: number}> {
  const roots: Array<{real: number, imag: number}> = []
  const n = coeffs.length - 1
  
  for (let k = 0; k < n; k++) {
    const angle = 2 * Math.PI * k / n
    roots.push({
      real: Math.cos(angle),
      imag: Math.sin(angle)
    })
  }
  
  return roots
}

function calculateJitter(audioData: Float32Array, sampleRate: number): number {
  const periods: number[] = []
  const threshold = 0.3 * Math.max(...Array.from(audioData).map(Math.abs))
  
  let lastCrossing = -1
  for (let i = 1; i < audioData.length; i++) {
    if (audioData[i] >= threshold && audioData[i - 1] < threshold) {
      if (lastCrossing >= 0) {
        periods.push((i - lastCrossing) / sampleRate)
      }
      lastCrossing = i
    }
  }
  
  if (periods.length < 2) return 0
  
  let jitterSum = 0
  for (let i = 1; i < periods.length; i++) {
    jitterSum += Math.abs(periods[i] - periods[i - 1])
  }
  
  const avgPeriod = periods.reduce((a, b) => a + b, 0) / periods.length
  return avgPeriod > 0 ? jitterSum / ((periods.length - 1) * avgPeriod) : 0
}

function calculateShimmer(audioData: Float32Array): number {
  const peaks: number[] = []
  
  for (let i = 1; i < audioData.length - 1; i++) {
    if (audioData[i] > audioData[i - 1] && audioData[i] > audioData[i + 1]) {
      peaks.push(Math.abs(audioData[i]))
    }
  }
  
  if (peaks.length < 2) return 0
  
  let shimmerSum = 0
  for (let i = 1; i < peaks.length; i++) {
    shimmerSum += Math.abs(peaks[i] - peaks[i - 1])
  }
  
  const avgAmplitude = peaks.reduce((a, b) => a + b, 0) / peaks.length
  return avgAmplitude > 0 ? shimmerSum / ((peaks.length - 1) * avgAmplitude) : 0
}

export function compareVoiceFeatures(features1: VoiceFeatures, features2: VoiceFeatures): number {
  let totalSimilarity = 0
  let weights = 0

  const mfccSimilarity = cosineSimilarity(features1.mfcc, features2.mfcc)
  totalSimilarity += mfccSimilarity * 4
  weights += 4

  const pitchDiff = Math.abs(features1.pitch - features2.pitch)
  const pitchSimilarity = 1 - Math.min(pitchDiff / 200, 1)
  totalSimilarity += pitchSimilarity * 2
  weights += 2

  const energyDiff = Math.abs(features1.energy - features2.energy)
  const energySimilarity = 1 - Math.min(energyDiff / Math.max(features1.energy, features2.energy, 0.001), 1)
  totalSimilarity += energySimilarity * 1
  weights += 1

  const formantSimilarity = cosineSimilarity(features1.formants, features2.formants)
  totalSimilarity += formantSimilarity * 3
  weights += 3

  const jitterDiff = Math.abs(features1.jitter - features2.jitter)
  const jitterSimilarity = 1 - Math.min(jitterDiff / Math.max(features1.jitter, features2.jitter, 0.001), 1)
  totalSimilarity += jitterSimilarity * 1.5
  weights += 1.5

  const shimmerDiff = Math.abs(features1.shimmer - features2.shimmer)
  const shimmerSimilarity = 1 - Math.min(shimmerDiff / Math.max(features1.shimmer, features2.shimmer, 0.001), 1)
  totalSimilarity += shimmerSimilarity * 1.5
  weights += 1.5

  return totalSimilarity / weights
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const len = Math.min(vec1.length, vec2.length)
  
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0
  
  for (let i = 0; i < len; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }
  
  norm1 = Math.sqrt(norm1)
  norm2 = Math.sqrt(norm2)
  
  if (norm1 === 0 || norm2 === 0) return 0
  
  return dotProduct / (norm1 * norm2)
}

export function verifyVoiceProfile(
  features: VoiceFeatures,
  profile: VoiceProfile,
  settings: BiometricSettings
): BiometricVerificationResult {
  const threshold = securityLevelThresholds[settings.securityLevel]
  
  const matchScore = compareVoiceFeatures(features, profile.voicePrint.averageFeatures)
  
  const qualityFactor = profile.voicePrint.quality
  const adjustedScore = matchScore * qualityFactor
  
  const verified = adjustedScore >= threshold
  
  return {
    verified,
    confidence: adjustedScore,
    userId: verified ? profile.userId : undefined,
    userName: verified ? profile.userName : undefined,
    matchScore,
    threshold,
    securityLevel: settings.securityLevel,
    timestamp: Date.now(),
    features,
    reason: verified ? 'Voice biometric match successful' : 'Voice biometric match failed - insufficient similarity'
  }
}

export function createEnrollmentSession(userId: string, settings: BiometricSettings): BiometricEnrollmentSession {
  return {
    sessionId: `enrollment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userId,
    startedAt: Date.now(),
    samples: [],
    requiredSamples: settings.enrollmentSamples,
    progress: 0,
    phrases: enrollmentPhrases.slice(0, settings.enrollmentSamples),
    currentPhraseIndex: 0,
    isComplete: false
  }
}

export function addEnrollmentSample(
  session: BiometricEnrollmentSession,
  features: VoiceFeatures
): BiometricEnrollmentSession {
  const samples = [...session.samples, features]
  const progress = (samples.length / session.requiredSamples) * 100
  const isComplete = samples.length >= session.requiredSamples
  
  return {
    ...session,
    samples,
    progress,
    currentPhraseIndex: Math.min(samples.length, session.phrases.length - 1),
    isComplete
  }
}

export function createVoiceProfile(session: BiometricEnrollmentSession, userName: string): VoiceProfile {
  const averageFeatures = calculateAverageFeatures(session.samples)
  const quality = calculateProfileQuality(session.samples)
  
  return {
    id: `profile-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userId: session.userId,
    userName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isVerified: true,
    enrollmentComplete: true,
    enrollmentProgress: 100,
    voicePrint: {
      features: session.samples,
      averageFeatures,
      enrollmentSamples: session.samples.length,
      quality
    },
    securityLevel: 'medium',
    accessPermissions: ['all'],
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0
  }
}

function calculateAverageFeatures(samples: VoiceFeatures[]): VoiceFeatures {
  const n = samples.length
  
  const mfccLength = samples[0].mfcc.length
  const avgMFCC: number[] = []
  for (let i = 0; i < mfccLength; i++) {
    avgMFCC.push(samples.reduce((sum, s) => sum + s.mfcc[i], 0) / n)
  }
  
  const formantsLength = samples[0].formants.length
  const avgFormants: number[] = []
  for (let i = 0; i < formantsLength; i++) {
    avgFormants.push(samples.reduce((sum, s) => sum + s.formants[i], 0) / n)
  }
  
  return {
    mfcc: avgMFCC,
    pitch: samples.reduce((sum, s) => sum + s.pitch, 0) / n,
    energy: samples.reduce((sum, s) => sum + s.energy, 0) / n,
    zeroCrossing: samples.reduce((sum, s) => sum + s.zeroCrossing, 0) / n,
    spectralCentroid: samples.reduce((sum, s) => sum + s.spectralCentroid, 0) / n,
    spectralRolloff: samples.reduce((sum, s) => sum + s.spectralRolloff, 0) / n,
    tempo: samples.reduce((sum, s) => sum + s.tempo, 0) / n,
    formants: avgFormants,
    jitter: samples.reduce((sum, s) => sum + s.jitter, 0) / n,
    shimmer: samples.reduce((sum, s) => sum + s.shimmer, 0) / n
  }
}

function calculateProfileQuality(samples: VoiceFeatures[]): number {
  if (samples.length < 2) return 0.5
  
  const consistencyScores: number[] = []
  
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const similarity = compareVoiceFeatures(samples[i], samples[j])
      consistencyScores.push(similarity)
    }
  }
  
  const avgConsistency = consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length
  
  const sampleQuality = Math.min(samples.length / 5, 1)
  
  return (avgConsistency * 0.7 + sampleQuality * 0.3)
}

export function updateVoiceProfileWithVerification(
  profile: VoiceProfile,
  verification: BiometricVerificationResult,
  settings: BiometricSettings
): VoiceProfile {
  const totalVerifications = profile.totalVerifications + 1
  const successfulVerifications = profile.successfulVerifications + (verification.verified ? 1 : 0)
  const failedVerifications = profile.failedVerifications + (verification.verified ? 0 : 1)
  
  let updatedVoicePrint = profile.voicePrint
  
  if (verification.verified && settings.adaptiveLearning) {
    const updatedFeatures = [...profile.voicePrint.features, verification.features]
    if (updatedFeatures.length > settings.enrollmentSamples * 2) {
      updatedFeatures.shift()
    }
    
    const averageFeatures = calculateAverageFeatures(updatedFeatures)
    const quality = calculateProfileQuality(updatedFeatures)
    
    updatedVoicePrint = {
      features: updatedFeatures,
      averageFeatures,
      enrollmentSamples: updatedFeatures.length,
      quality
    }
  }
  
  return {
    ...profile,
    updatedAt: Date.now(),
    totalVerifications,
    successfulVerifications,
    failedVerifications,
    lastVerificationAt: Date.now(),
    voicePrint: updatedVoicePrint
  }
}

export function detectLiveness(audioData: Float32Array, sampleRate: number): boolean {
  const energy = calculateEnergy(audioData)
  const zcr = calculateZeroCrossingRate(audioData)
  
  if (energy < 0.001) return false
  
  if (zcr < 0.01 || zcr > 0.5) return false
  
  const variance = calculateVariance(audioData)
  if (variance < 0.0001) return false
  
  return true
}

function calculateVariance(audioData: Float32Array): number {
  const mean = audioData.reduce((a, b) => a + b, 0) / audioData.length
  const squaredDiffs = Array.from(audioData).map(x => (x - mean) ** 2)
  return squaredDiffs.reduce((a, b) => a + b, 0) / audioData.length
}

export function detectSpoofing(features: VoiceFeatures): boolean {
  if (features.jitter < 0.001 || features.jitter > 0.05) return true
  
  if (features.shimmer < 0.001 || features.shimmer > 0.1) return true
  
  if (features.pitch < 50 || features.pitch > 400) return true
  
  const formantRatios: number[] = []
  for (let i = 1; i < features.formants.length; i++) {
    if (features.formants[i - 1] > 0) {
      formantRatios.push(features.formants[i] / features.formants[i - 1])
    }
  }
  
  if (formantRatios.length === 0) return false
  
  const avgRatio = formantRatios.reduce((a, b) => a + b, 0) / formantRatios.length
  if (avgRatio < 1.5 || avgRatio > 4) return true
  
  return false
}
