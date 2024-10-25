'use client'

import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { Description, Field, FieldGroup, Label } from '@/components/fieldset'
import { Input } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { Proof, ReclaimProofRequest, transformForOnchain } from '@reclaimprotocol/js-sdk'
import { ethers } from 'ethers'
import { useQRCode } from 'next-qrcode'
import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

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
  const [proof, setProof] = useState<Proof | null>(null)

  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

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
          setProof(proof)
          window.localStorage.setItem('proof', JSON.stringify(proof))
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

  const testVerification = async () => {
    // if (!proof) {
    //   return
    // }
    // console.log('testVerification', proof)
    // const result = await verifyProof(proof)
    // console.log('verifyProof result', result)

    const proofString = window.localStorage.getItem('proof')
    if (!proofString) {
      return
    }
    const proof = JSON.parse(proofString)

    const forOnchain = transformForOnchain(proof)
    const provider = new ethers.BrowserProvider((window as any).ethereum)
    const signer = await provider.getSigner()

    //onchainでverifyする
    const contract = new ethers.Contract(
      '0xcd94A4f7F85dFF1523269C52D0Ab6b85e9B22866', // polygon amoy testnet
      [
        {
          inputs: [
            {
              components: [
                {
                  components: [
                    {
                      internalType: 'string',
                      name: 'provider',
                      type: 'string',
                    },
                    {
                      internalType: 'string',
                      name: 'parameters',
                      type: 'string',
                    },
                    {
                      internalType: 'string',
                      name: 'context',
                      type: 'string',
                    },
                  ],
                  internalType: 'struct Claims.ClaimInfo',
                  name: 'claimInfo',
                  type: 'tuple',
                },
                {
                  components: [
                    {
                      components: [
                        {
                          internalType: 'bytes32',
                          name: 'identifier',
                          type: 'bytes32',
                        },
                        {
                          internalType: 'address',
                          name: 'owner',
                          type: 'address',
                        },
                        {
                          internalType: 'uint32',
                          name: 'timestampS',
                          type: 'uint32',
                        },
                        {
                          internalType: 'uint32',
                          name: 'epoch',
                          type: 'uint32',
                        },
                      ],
                      internalType: 'struct Claims.CompleteClaimData',
                      name: 'claim',
                      type: 'tuple',
                    },
                    {
                      internalType: 'bytes[]',
                      name: 'signatures',
                      type: 'bytes[]',
                    },
                  ],
                  internalType: 'struct Claims.SignedClaim',
                  name: 'signedClaim',
                  type: 'tuple',
                },
              ],
              internalType: 'struct Reclaim.Proof',
              name: 'proof',
              type: 'tuple',
            },
          ],
          name: 'verifyProof',
          outputs: [
            {
              internalType: 'bool',
              name: '',
              type: 'bool',
            },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      signer
    )
    const kekka = await contract.verifyProof(forOnchain)
    console.log('onchain verify kekka', kekka)
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
          {isConnected ? (
            <Button onClick={() => testVerification()}>List for Sale</Button>
          ) : (
            <Button onClick={() => connect({ chainId: polygonAmoy.id, connector: injected() })}> connect wallet</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
