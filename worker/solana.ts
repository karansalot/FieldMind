import { Connection, Keypair, Transaction, TransactionInstruction, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js'
import bs58 from 'bs58'

const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

export async function verifyOnSolana(
    inspection: { id: string; report_number: string; machine_model: string; status: string; risk_score: number; nogo_count: number; caution_count: number },
    privateKeyB58: string
): Promise<{ signature: string; explorer_url: string; verified_at: string }> {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const wallet = Keypair.fromSecretKey(bs58.decode(privateKeyB58))

    const payload = JSON.stringify({
        app: 'FieldMind', v: '2.0.0',
        report: inspection.report_number,
        id: inspection.id,
        machine: inspection.machine_model,
        status: inspection.status,
        risk: inspection.risk_score,
        no_go: inspection.nogo_count,
        caution: inspection.caution_count,
        ts: Date.now()
    })

    const tx = new Transaction().add(
        new TransactionInstruction({
            keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
            programId: MEMO_PROGRAM,
            data: Buffer.from(payload, 'utf8')
        })
    )

    const signature = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: 'confirmed' })
    return {
        signature,
        explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        verified_at: new Date().toISOString()
    }
}
