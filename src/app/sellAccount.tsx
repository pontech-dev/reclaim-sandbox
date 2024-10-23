'use client'

import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { Description, Field, FieldGroup, Label } from '@/components/fieldset'
import { Input } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { Proof, ReclaimProofRequest } from '@reclaimprotocol/js-sdk'
import { useQRCode } from 'next-qrcode'
import { useEffect, useState } from 'react'

export function SellAccount({ amount, ...props }: { amount: string } & React.ComponentPropsWithoutRef<typeof Button>) {
  let [isOpen, setIsOpen] = useState(false)

  const [verificationReqUrl, setVerificationReqUrl] = useState<string | undefined>('')
  const [extracted, setExtracted] = useState<{
    subscriberCount: number
    totalVideoViewCount: number
    videoCount: number
  } | null>(null)
  const { Canvas } = useQRCode()
  const [reclaimProofRequest, setReclaimProofRequest] = useState<ReclaimProofRequest | null>(null)

  async function initializeReclaimProofRequest() {
    try {
      // ReclaimProofRequest Fields:
      // - applicationId: Unique identifier for your application
      // - providerId: Identifier for the specific provider you're using
      // - sessionId: Unique identifier for the current proof request session
      // - context: Additional context information for the proof request
      // - requestedProof: Details of the proof being requested
      // - signature: Cryptographic signature for request authentication
      // - redirectUrl: URL to redirect after proof generation (optional)
      // - appCallbackUrl: URL for receiving proof generation updates (optional)
      // - timeStamp: Timestamp of the proof request
      // - options: Additional configuration options

      const proofRequest = await ReclaimProofRequest.init(
        process.env.NEXT_PUBLIC_RECLAIM_APP_ID!,
        process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET!,
        'b73bb6e3-c756-4065-9ff1-b64a72ace21b',
        // Uncomment the following line to enable logging and AI providers
        { log: true, acceptAiProviders: true }
      )
      console.log(proofRequest)
      setReclaimProofRequest(proofRequest)

      // Add context to the proof request (optional)
      proofRequest.addContext('0x00000000000', 'Example context message')

      // Set parameters for the proof request (if needed)
      // proofRequest.setParams({ email: "test@example.com", userName: "testUser" })

      // Set a redirect URL (if needed)
      // proofRequest.setRedirectUrl('https://example.com/redirect')

      // Set a custom app callback URL (if needed)
      // proofRequest.setAppCallbackUrl('https://example.com/callback')

      // Uncomment the following line to log the proof request and to get the Json String
      // console.log('Proof request initialized:', proofRequest.toJsonString())
    } catch (error) {
      console.error('Error initializing ReclaimProofRequest:', error)
    }
  }

  useEffect(() => {
    initializeReclaimProofRequest()
  }, [])

  async function startVerificationSession() {
    setIsOpen(true)

    if (!reclaimProofRequest) {
      // loop until reclaimProofRequest is initialized
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('ReclaimProofRequest:', reclaimProofRequest)
      return startVerificationSession()
    }

    console.log('ReclaimProofRequest:', reclaimProofRequest)

    try {
      // Generate the request URL for QR code
      const requestUrl = await reclaimProofRequest.getRequestUrl()
      setVerificationReqUrl(requestUrl)

      // Get the status URL for checking proof status
      const statusUrl = reclaimProofRequest.getStatusUrl()
      console.log('Status URL:', statusUrl)

      // Start the verification session
      await reclaimProofRequest.startSession({
        onSuccess: async (proof: Proof) => {
          console.log('Proof received:', proof)
          console.log('JSON.parse(proof.claimData.context)', JSON.parse(proof.claimData.context))
          const jsonObject = JSON.parse(proof.claimData.context)
          const metricString = jsonObject.extractedParameters.metric
          const metricObject = JSON.parse(metricString)
          const { subscriberCount, totalVideoViewCount, videoCount } = metricObject
          setExtracted({ subscriberCount, totalVideoViewCount, videoCount })
        },
        onError: (error: Error) => {
          console.error('Error in proof generation:', error)
        },
      })
    } catch (error) {
      console.error('Error starting verification session:', error)
    }
  }

  return (
    <>
      <Button type="button" onClick={() => startVerificationSession()} {...props} />
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Proove your account</DialogTitle>
        <DialogDescription>Scan this QR code to start the verification process:</DialogDescription>

        <DialogBody>
          <FieldGroup>
            {verificationReqUrl ? (
              <div>
                <Link href={verificationReqUrl} target="_blank">
                  <Canvas
                    text={verificationReqUrl}
                    options={{
                      errorCorrectionLevel: 'M',
                      margin: 3,
                      scale: 4,
                      width: 200,
                      color: {
                        dark: '#000000ff',
                        light: '#ffffffff',
                      },
                    }}
                  />
                </Link>
              </div>
            ) : (
              <p>Initializing verification session...</p>
            )}
            {extracted && (
              <>
                <p>subscriberCount: {extracted.subscriberCount}</p>
                <p>videoCount: {extracted.videoCount}</p>
                <p>totalVideoViewCount: {extracted.totalVideoViewCount}</p>
                <Field>
                  <Label>Amount</Label>
                  <Input name="amount" defaultValue={amount} placeholder="$0.00" autoFocus />
                </Field>
                <Field>
                  <Label>Reason</Label>
                  <Select name="reason" defaultValue="">
                    <option value="" disabled>
                      Select a reason&hellip;
                    </option>
                    <option value="duplicate">Duplicate</option>
                    <option value="fraudulent">Fraudulent</option>
                    <option value="requested_by_customer">Requested by customer</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <CheckboxField>
                  <Checkbox name="notify" />
                  <Label>Term of Use</Label>
                  <Description>
                    I agree to the <Link href="/terms-of-use">Terms of Use</Link>
                  </Description>
                </CheckboxField>
              </>
            )}
          </FieldGroup>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>List for Sale</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
